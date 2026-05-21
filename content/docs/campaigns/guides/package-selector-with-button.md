---
title: Package Selector with Add-to-Cart Button
---

Legacy product page pattern: the visitor picks an option from a set of package cards, then clicks a single "Add to Cart" button. The Package Selector tracks the choice; the button writes to the cart.

:::caution
For new SDK 0.4.x quantity-tier builds, prefer the [Bundle Selector](/docs/campaigns/bundle-selector) with one product/variant package and Offer-based tier pricing. Use this package-selector pattern only when an existing campaign intentionally models each option as a separate package record.
:::

## What You're Building

- A row of selectable package cards from an existing package-per-option campaign
- Each card shows the price and optional savings pulled from the backend
- One card is pre-selected by default
- A single "Add to Cart" button that reads the current selection and adds it

## Step 1: The Selector in Select Mode

Use `data-next-selection-mode="select"` so clicking a card only updates the selection — it does not write to the cart yet. Give the selector a `data-next-selector-id` so the button can reference it.

```html
<div data-next-package-selector
     data-next-selector-id="qty-picker"
     data-next-selection-mode="select">

  <div data-next-selector-card
       data-next-package-id="10"
       data-next-selected="true">
    <h3>1 Bottle</h3>
    <span data-next-package-price></span>
  </div>

  <div data-next-selector-card data-next-package-id="11">
    <h3>3 Bottles</h3>
    <span data-next-package-price></span>
    <del data-next-package-price="compare"></del>
    <span>Save <span data-next-package-price="savings"></span></span>
  </div>

  <div data-next-selector-card data-next-package-id="12">
    <h3>6 Bottles</h3>
    <span data-next-package-price></span>
    <del data-next-package-price="compare"></del>
  </div>

</div>

<button data-next-action="add-to-cart"
        data-next-selector-id="qty-picker">
  Add to Cart
</button>
```

The button reads the current selection from the selector with the matching `data-next-selector-id`.

:::caution
Never use `data-next-selection-mode="swap"` (or omit it, since swap is the default) on a selector that also feeds an `AddToCartEnhancer` button. Clicking a card would write to the cart **and** the button would write again — resulting in a double add.
:::

## Step 2: Add Styling for the Selected State

```css
[data-next-selector-card] {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
}

[data-next-selector-card].next-selected {
  border-color: #2563eb;
  background: #eff6ff;
}

[data-next-selector-card].next-loading [data-next-package-price] {
  opacity: 0.4;
}
```

## Step 3: Auto-Render with Badges

When the options need badges ("Most Popular", "Best Value") or other custom fields, use auto-render mode with a card template.

```html
<div data-next-package-selector
     data-next-selector-id="qty-picker"
     data-next-selection-mode="select"
     data-next-packages='[
       {"packageId": 10, "label": "1 Bottle", "selected": true},
       {"packageId": 11, "label": "3 Bottles", "badge": "Most Popular"},
       {"packageId": 12, "label": "6 Bottles", "badge": "Best Value"}
     ]'
     data-next-package-template-id="pkg-card-tpl">
</div>

<template id="pkg-card-tpl">
  <div data-next-selector-card>
    <span class="badge">{package.badge}</span>
    <h3>{package.label}</h3>
    <span data-next-package-price></span>
    <del data-next-package-price="compare"></del>
    <span class="savings">Save <span data-next-package-price="savings"></span></span>
  </div>
</template>

<button data-next-action="add-to-cart"
        data-next-selector-id="qty-picker">
  Add to Cart
</button>
```

Any field in the JSON definition is available as `{package.<fieldName>}` in the template.

## Step 4: Inline Quantity Controls

When a card should allow the visitor to set a custom quantity before adding, add `+`/`−` buttons inside the card:

```html
<div data-next-selector-card
     data-next-package-id="10"
     data-next-quantity="1"
     data-next-min-quantity="1"
     data-next-max-quantity="10"
     data-next-selected="true">
  <h3>Product</h3>
  <button data-next-quantity-decrease>−</button>
  <span data-next-quantity-display>1</span>
  <button data-next-quantity-increase>+</button>
  <span data-next-package-price></span>
</div>
```

The `+`/`−` buttons are automatically disabled at the min/max limits. In select mode the quantity is passed to the add-to-cart button when it's clicked.

## Step 5: Show the Current Selection Elsewhere

Display the selected package name or price anywhere on the page using `data-next-display`:

```html
<!-- Shows the selected package name, updating live as the visitor switches -->
<p>Selected: <strong data-next-display="selection.qty-picker.name">—</strong></p>
<p>Price: <span data-next-display="selection.qty-picker.price">—</span></p>
```

The value after `selection.` must match the `data-next-selector-id`.

## Full Example

```html
<!-- Package selector -->
<div class="package-selector"
     data-next-package-selector
     data-next-selector-id="product"
     data-next-selection-mode="select"
     data-next-packages='[
       {"packageId": 10, "label": "1 Bottle", "desc": "Try it out", "selected": true},
       {"packageId": 11, "label": "3 Bottles", "desc": "Most popular", "badge": "Popular"},
       {"packageId": 12, "label": "6 Bottles", "desc": "Best value", "badge": "Best Value"}
     ]'
     data-next-package-template-id="pkg-tpl">
</div>

<template id="pkg-tpl">
  <div data-next-selector-card class="pkg-card">
    <div class="pkg-badge">{package.badge}</div>
    <h3>{package.label}</h3>
    <p class="pkg-desc">{package.desc}</p>
    <div class="pkg-price">
      <span data-next-package-price></span>
      <del data-next-package-price="compare"></del>
    </div>
    <p class="pkg-savings">Save <span data-next-package-price="savings"></span></p>
  </div>
</template>

<!-- Add to cart -->
<button class="btn-add-to-cart"
        data-next-action="add-to-cart"
        data-next-selector-id="product">
  Add to Cart
</button>

<style>
  .package-selector {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .pkg-card {
    flex: 1;
    position: relative;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 1rem;
    cursor: pointer;
    text-align: center;
  }
  .pkg-card.next-selected {
    border-color: #2563eb;
    background: #eff6ff;
  }
  .pkg-badge:empty { display: none }
  .pkg-badge {
    position: absolute;
    top: -0.6rem;
    left: 50%;
    transform: translateX(-50%);
    background: #2563eb;
    color: white;
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    white-space: nowrap;
  }
  .pkg-savings:empty { display: none }
  .btn-add-to-cart {
    width: 100%;
    padding: 1rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
  }
  .btn-add-to-cart[data-next-loading="true"] {
    opacity: 0.7;
    pointer-events: none;
  }
</style>
```

## Reacting to Selection Changes

```javascript
window.nextReady.push(() => {
  window.next.on('selector:selection-changed', ({ selectorId, packageId, quantity }) => {
    if (selectorId === 'product') {
      console.log('Visitor picked package', packageId, 'qty', quantity);
    }
  });
});
```
