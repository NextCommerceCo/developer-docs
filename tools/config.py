SITE_DOMAIN = "https://developers.nextcommerce.com"
BASE_API_FILES_PATH = "../public/api/"

CAMPAIGNS_API_SPEC_SOURCE = "https://campaigns.apps.29next.com/api/schema/"

CAMPAIGNS_API_SPEC_ADDITIONS = {
    "servers": [{"url": "https://campaigns.apps.29next.com", "description": ""}],
    "security": [{"API Authentication": []}],
}

CAMPAIGNS_API_DESCRIPTION = """
## Overview
Campaigns API is a headless API for developers to easily create complex external checkout flows using javascript, **no backend server-side integration required**.

Before using the Campaigns API, you'll need to install the **Campaigns App** on your store and create a campaign to retrieve your API Key.

## Authentication

Campaigns API uses unique API Keys for authentication to access campaign details and execute the checkout flow with your configured packages.

## Rate Limiting

Campaign APIs are rate-limited to maintain the stability for all users. We employ a number of methods to enforce rate limits including API Keys and IP Address.

| Identifier | Rate Limit Method | Limit |
| ---- | ---- | ---- |
| IP Address | Request-based | 4 requests/second |

### Sample

The following sample shows the API response for the status code 429.

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1
```

### Why Rate Limits?

Rate limiting is required to prevent the network and application services from becoming overloaded.

Setting a rate limit helps to prevent API abuse and provide overall fairness of use across the platform.
"""


ADMIN_API_SPEC_SOURCE = "https://sandbox.29next.store/api/schema/admin/"

ADMIN_API_SPEC_ADDITIONS = {
    "servers": [
        {
            "url": "https://{store}.29next.store/api/admin/",
            "description": "",
            "variables": {
                "store": {
                    "default": "example",
                    "description": "Store unique subdomain used to identify the store.",
                }
            },
        }
    ],
    "security": [{"oauth2": []}],
}

ADMIN_API_DESCRIPTION = """
## Authentication
The Admin API uses Oauth 2 Bearer Access Tokens to manage access to your store's resources. Oauth Apps (and associated access tokens) can be tailored with object-level permission to ensure that each integrated service only has access to necessary objects.

Before using the Admin API, you'll need to create a store and create an OAuth App necessary for API access.

To create an OAuth App, navigate to **Settings > API Access** and create a new Oauth App with applicable [permission scopes](https://developers.29next.com/docs/api/admin/permissions/) to retrieve your Access Token.

It's recommended to create unique Oauth Apps per external system so that you can revoke as needed.

## Versioning

API versioning allows 29 Next to continuously evolve the platform while maintaining predictable behavior for existing APIs with a path for upgrades and deprecations.

To specify a version, pass the `X-29Next-Api-Version` header with your desired API version.

## Rate Limiting

Admin APIs are rate-limited to maintain the stability and equity of our platform for all users. We employ a number of methods to enforce rate limits including API Access Token and IP Address.

| Identifier | Rate Limit Method | Limit |
| ---- | ---- | ---- |
| Access Token | Request-based | 4 requests/second |

### Sample

The following sample shows the API response for the status code 429.

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1
```

### Why Rate Limits?

Rate limiting is required to prevent the network and application services from becoming overloaded.

Setting a rate limit helps to prevent API abuse and provide overall fairness of use across the platform.
"""

API_VERSIONS = [
    {
        "type": "campaigns",
        "version": "v1",
        "source": CAMPAIGNS_API_SPEC_SOURCE,
        "additions": CAMPAIGNS_API_SPEC_ADDITIONS,
        "description": CAMPAIGNS_API_DESCRIPTION,
    },
    {
        "type": "admin",
        "version": "2023-02-10",
        "source": ADMIN_API_SPEC_SOURCE,
        "additions": ADMIN_API_SPEC_ADDITIONS,
        "description": ADMIN_API_DESCRIPTION,
    },
    {
        "type": "admin",
        "version": "2024-04-01",
        "source": ADMIN_API_SPEC_SOURCE,
        "additions": ADMIN_API_SPEC_ADDITIONS,
        "description": ADMIN_API_DESCRIPTION,
    },
    {
        "type": "admin",
        "version": "unstable",
        "source": ADMIN_API_SPEC_SOURCE,
        "additions": ADMIN_API_SPEC_ADDITIONS,
        "description": ADMIN_API_DESCRIPTION,
    },
]

# Custom Webhook Event Payloads
# These payloads don't follow their respective object data schema.
CUSTOM_WEBHOOK_EVENT_PAYLOADS = [
    {
        "event": "product.deleted",
        "data": {
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'integer',
                    'description': 'The unique identifier of the deleted product.',
                }
            }
        }
    },
    {
        "event": "customer.redacted",
        "data": {
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'integer',
                    'description': 'The unique identifier of the redacted customer.',
                },
                'email': {
                    'type': 'string',
                    'description': 'The email address of the redacted customer.',
                },
                'phone_number': {
                    'type': 'string',
                    'description': 'The phone number of the redacted customer.',
                },
                'orders': {
                    'type': 'array',
                    'description': 'List of order IDs associated with the redacted customer.',
                },
                'subscriptions': {
                    'type': 'array',
                    'description': 'List of subscription IDs associated with the redacted customer.',
                },
            }
        }
    }
]


WEBHOOKS = [
    {
        "event": "app.uninstalled",
        "object": "app",
        "schema_ref": "#/components/schemas/PublicApp",
        "tag": "apps",
        "description": "Triggers when an app is uninstalled.",
    },
    {
        "event": "cart.abandoned",
        "object": "cart",
        "schema_ref": "#/components/schemas/CartDetail",
        "tag": "carts",
        "description": "Triggers when a cart is marked as abandoned.",
    },
    {
        "event": "customer.created",
        "object": "customer",
        "schema_ref": "#/components/schemas/User",
        "tag": "customers",
        "description": "Triggers when a new customer is created.",
    },
    {
        "event": "customer.redacted",
        "object": "customer",
        "schema_ref": None,
        "tag": "customers",
        "description": "Triggers when a customer is redacted.",
    },
    {
        "event": "customer.updated",
        "object": "customer",
        "schema_ref": "#/components/schemas/User",
        "tag": "customers",
        "description": "Triggers when a customer is updated.",
    },
    {
        "event": "dispute.created",
        "object": "dispute",
        "schema_ref": "#/components/schemas/Dispute",
        "tag": "payments",
        "description": "Triggers when a new dispute is created.",
    },
    {
        "event": "dispute.updated",
        "object": "dispute",
        "schema_ref": "#/components/schemas/Dispute",
        "tag": "payments",
        "description": "Triggers when a dispute is updated.",
    },
    {
        "event": "export.created",
        "object": "export",
        "schema_ref": "#/components/schemas/Export",
        "tag": "exports",
        "description": "Triggers when an export is created.",
    },
    {
        "event": "fulfillment.created",
        "object": "fulfillment",
        "schema_ref": "#/components/schemas/FulfillmentResponse",
        "tag": "fulfillment",
        "description": "Triggers when a fulfillment is created.",
    },
    {
        "event": "fulfillment.updated",
        "object": "fulfillment",
        "schema_ref": "#/components/schemas/FulfillmentResponse",
        "tag": "fulfillment",
        "description": "Triggers when a fulfillment is updated.",
    },
    {
        "event": "gateway.created",
        "object": "gateway",
        "schema_ref": "#/components/schemas/PaymentGateway",
        "tag": "payments",
        "description": "Triggers when a new gateway is created.",
    },
    {
        "event": "gateway.updated",
        "object": "gateway",
        "schema_ref": "#/components/schemas/PaymentGateway",
        "tag": "payments",
        "description": "Triggers when a gateway is updated.",
    },
    {
        "event": "order.created",
        "object": "order",
        "schema_ref": "#/components/schemas/Order",
        "tag": "orders",
        "description": "Triggers when an new order is created.",
    },
    {
        "event": "order.updated",
        "object": "order",
        "schema_ref": "#/components/schemas/Order",
        "tag": "orders",
        "description": "Triggers when an order is updated.",
    },
    {
        "event": "product.created",
        "object": "product",
        "schema_ref": "#/components/schemas/Product",
        "tag": "products",
        "description": "Triggers when a new product is created.",
    },
    {
        "event": "product.updated",
        "object": "product",
        "schema_ref": "#/components/schemas/Product",
        "tag": "products",
        "description": "Triggers when a product is updated.",
    },
    {
        "event": "product.deleted",
        "object": "product",
        "schema_ref": None,
        "tag": "products",
        "description": "Triggers when a product is deleted.",
    },
    {
        "event": "transaction.created",
        "object": "transaction",
        "schema_ref": "#/components/schemas/Transaction",
        "tag": "payments",
        "description": "Triggers when a payment transaction is created.",
    },
    {
        "event": "transaction.updated",
        "object": "transaction",
        "schema_ref": "#/components/schemas/Transaction",
        "tag": "payments",
        "description": "Triggers when a payment transaction is updated.",
    },
    {
        "event": "subscription.created",
        "object": "subscription",
        "schema_ref": "#/components/schemas/Subscription",
        "tag": "subscriptions",
        "description": "Triggers when a new subscription is created.",
    },
    {
        "event": "subscription.updated",
        "object": "subscription",
        "schema_ref": "#/components/schemas/Subscription",
        "tag": "subscriptions",
        "description": "Triggers when a subscription is updated.",
    },
    {
        "event": "store.updated",
        "object": "store",
        "schema_ref": "#/components/schemas/Store",
        "tag": "store",
        "description": "Triggers when store settings are updated.",
    },
    {
        "event": "ticket.created",
        "object": "ticket",
        "schema_ref": "#/components/schemas/Ticket",
        "tag": "support",
        "description": "Triggers a new support ticket is created.",
    },
    {
        "event": "ticket.updated",
        "object": "ticket",
        "schema_ref": "#/components/schemas/Ticket",
        "tag": "support",
        "description": "Triggers a support ticket is updated.",
    },
]
