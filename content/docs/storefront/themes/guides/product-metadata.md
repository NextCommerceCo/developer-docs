---
title: Product Metadata
sidebar_label: Product Metadata
tags:
 - Guide
---

Product metadata lets you add custom data for products to use in theme templates. This provides a robust structured way for theme developers to customize products display in the storefront. [See our user guide on adding custom metadata fields](https://docs.nextcommerce.com/docs/build-a-store/technical-settings/metadata-fields-and-tags).


### Template Access

Product metadata values are accessible in theme templates through their metadata `key`.

```django title="Template Access"
{{ product.metadata.<key> }}
```

Values set for the given the product metadata will render in the product template.

### Example

Let's look at an example of adding support for a **Product Tagline** to a product template that can be set on an individual product basis in the dashboard.

**Create Tagline Product Metadata Field**

In your store Metadata settings, create a new Metadata Definition for your tagline. Set the the **object** to `Product` and **key** to `tagline`.

**Add Tagline Attribute Variable to Product Template**

In your theme's product template, add the code below to render the tagline by accessing it with a template variable.

```django title="Example"
{{ product.metadata.tagline }}
```

**Add Tagline Value to Product**

In your product metadata settings, add your tagline field with a value to render the your storefront product details. :clap:

