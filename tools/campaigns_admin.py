import requests
import yaml

from config import (
    CAMPAIGNS_ADMIN_API_SPEC_SOURCE,
    CAMPAIGNS_ADMIN_DROP_PARAMETERS,
    CAMPAIGNS_ADMIN_OPERATION_IDS,
    CAMPAIGNS_ADMIN_PATH_PREFIX,
)


def inline_refs(node, schemas):
    """
    Replace every $ref with the schema it points at.

    The campaigns app defines Country and PaymentMethod under names the admin spec
    already uses for different objects, so nothing is copied into the admin spec's
    components. Each operation carries its own resolved schemas instead.
    """
    if isinstance(node, list):
        return [inline_refs(each, schemas) for each in node]
    if not isinstance(node, dict):
        return node
    if "$ref" in node:
        return inline_refs(schemas[node["$ref"].split("/")[-1]], schemas)
    return {key: inline_refs(value, schemas) for key, value in node.items()}


def admin_version_parameter(version):
    """The version header the admin spec puts on every operation."""
    return {
        "in": "header",
        "name": "X-29next-API-Version",
        "required": True,
        "schema": {"default": version, "enum": [version], "type": "string"},
    }


def campaigns_admin_paths(version):
    """
    Fetch the campaigns admin endpoints and return path items for the admin spec.

    Merchants reach these through the store admin API, which proxies the request to
    the campaigns app and enforces the permission scope. Paths are rewritten to be
    relative to the admin server url, and the proxy's own auth is replaced with the
    store's oauth2 scopes.
    """
    response = requests.get(CAMPAIGNS_ADMIN_API_SPEC_SOURCE)
    response.raise_for_status()

    spec = yaml.safe_load(response.content)
    schemas = spec["components"]["schemas"]

    paths = {}
    for path, path_item in spec["paths"].items():
        admin_path = path[len(CAMPAIGNS_ADMIN_PATH_PREFIX):]
        paths[admin_path] = {}

        for method, operation in path_item.items():
            operation = inline_refs(operation, schemas)
            operation["operationId"] = CAMPAIGNS_ADMIN_OPERATION_IDS[operation["operationId"]]
            operation["parameters"] = [
                each
                for each in operation.get("parameters", [])
                if each["name"] not in CAMPAIGNS_ADMIN_DROP_PARAMETERS
            ]
            operation["parameters"].append(admin_version_parameter(version))
            operation["security"] = [
                {"oauth2": ["campaigns:read" if method == "get" else "campaigns:write"]}
            ]
            paths[admin_path][method] = operation

    return paths
