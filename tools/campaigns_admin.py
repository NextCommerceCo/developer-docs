import re

import requests
import yaml

from config import (
    CAMPAIGNS_ADMIN_API_SPEC_SOURCE,
    CAMPAIGNS_ADMIN_DROP_PARAMETERS,
    CAMPAIGNS_ADMIN_PATH_PREFIX,
)

# The admin spec's operationIds are drf-spectacular's defaults (openapi.py
# get_operation_id): the path with its {parameters} removed, tokenized on "/",
# dashes as underscores, the method's action appended, then camelized the way
# plumbing.py camelize_operation does with inflection.camelize(id, False).
METHOD_ACTIONS = {
    "get": "retrieve",
    "post": "create",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
}


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


def is_list_response(operation):
    """
    drf-spectacular names a GET "list" when its response is a list serializer
    (openapi.py _is_list_view), which the spec emits as an array or as a paginated
    object whose "results" is an array. Reads the lowest 2xx response, as it does.
    """
    responses = operation.get("responses", {})
    code = min((each for each in responses if each.startswith("2")), default=None)
    if code is None:
        return False
    schema = responses[code].get("content", {}).get("application/json", {}).get("schema", {})
    if schema.get("type") == "array":
        return True
    return schema.get("properties", {}).get("results", {}).get("type") == "array"


def admin_operation_id(admin_path, method, operation):
    """The admin spec's default operationId for this operation; it sets the docs page filename and title."""
    tokens = re.sub(r"\{[\w\-]+\}", "", admin_path).strip("/").split("/")
    tokens = [each.replace("-", "_") for each in tokens if each]
    action = "list" if method == "get" and is_list_response(operation) else METHOD_ACTIONS[method]
    joined = "_".join(tokens + [action])
    return joined[0].lower() + re.sub(r"(?:^|_)(.)", lambda match: match.group(1).upper(), joined)[1:]


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
            operation["operationId"] = admin_operation_id(admin_path, method, operation)
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
