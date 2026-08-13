import requests
import yaml

from campaigns_admin import campaigns_admin_paths
from config import BASE_API_FILES_PATH, API_VERSIONS
from webhooks import webhook_schema_generator


def download_and_update_spec_file(type, source, version, description, additions, campaigns_admin):
    api_file = BASE_API_FILES_PATH + "/{}/{}.yaml".format(type, version)

    response = requests.get(source, {"version": version})
    response.raise_for_status()

    with open(api_file, "wb") as f:
        f.write(response.content)

    with open(api_file, "r") as f:
        spec = yaml.safe_load(f.read())

    spec["info"]["description"] = description
    if type == "admin":
        spec["webhooks"] = webhook_schema_generator(spec)
    if campaigns_admin:
        spec["paths"].update(campaigns_admin_paths(version))
    spec.update(additions)

    with open(api_file, "w") as f:
        yaml.safe_dump(spec, f)


def update_api_spec():

    for version in API_VERSIONS:
        print("Updating {} api version: {}".format(version["type"], version["version"]))
        download_and_update_spec_file(
            version["type"],
            version["source"],
            version["version"],
            version["description"],
            version["additions"],
            version.get("campaigns_admin", False),
        )


update_api_spec()
