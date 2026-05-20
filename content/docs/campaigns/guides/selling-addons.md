---
title: Selling Add-ons
---

Add-ons are optional extras — warranties, insurance, accessories, or upgrades — that visitors can independently toggle on or off. Unlike the Package Selector (pick one), any number of add-ons can be active at the same time.

## What You're Building

An add-on section where:
- Each add-on is a clickable card that adds or removes the package from the cart
- Active cards get a visual "selected" state
- Prices are shown with optional Offer-based savings
- One add-on can optionally be pre-selected (auto-added on page load)
- A warranty add-on can auto-match the quantity of the main product

## Step 1: Basic Add-on Cards

```html
<div data-next-package-toggle>

  <div data-next-toggle-card
       data-next-package-id="201"
       data-add-text="Add Warranty"
       data-remove-text="✓ Warranty Added">
    <h3>2-Year Warranty</h3>
    <span data-next-toggle-display="price"></span>
  </div>

  <div data-next-toggle-card
       data-next-package-id="202"
       data-add-text="Add Insurance"
       data-remove-text="✓ Insurance Added">
    <h3>Shipping Insurance</h3>
    <span data-next-toggle-display="price"></span>
    <del data-next-toggle-display="originalPrice"></del>
  </div>

</div>
```

Clicking a card that is **not** in the cart adds it. Clicking it again removes it.

## Step 2: Pre-Selected Add-on

Mark a card `data-next-selected="true"` to auto-add it when the page loads. This runs once per session — refreshing the page does not add it twice.

```html
<div data-next-toggle-card
     data-next-package-id="202"
     data-next-selected="true"
     data-add-text="Add Insurance"
     data-remove-text="✓ Insurance Added">
  Shipping Insurance — pre-selected
</div>
```

## Step 3: Style Active Cards

The enhancer applies CSS classes you can target:

```css
/* Default state */
[data-next-toggle-card] {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
}

/* Card is in the cart */
[data-next-toggle-card].next-in-cart {
  border-color: #16a34a;
  background: #f0fdf4;
}

/* Card is not in the cart */
[data-next-toggle-card].next-not-in-cart {
  opacity: 0.85;
}

/* Price loading */
[data-next-toggle-card].next-loading [data-next-toggle-display] {
  opacity: 0.4;
}
```

## Step 4: Show the Product Image

Add `data-next-toggle-image` to any `<img>` inside a card — the enhancer fills in the `src` from campaign data automatically.

```html
<div data-next-toggle-card data-next-package-id="201">
  <img data-next-toggle-image alt="Warranty" />
  <h3>2-Year Warranty</h3>
  <span data-next-toggle-display="price"></span>
</div>
```

## Step 5: Auto-Render from JSON

When you have several add-ons or want to keep markup clean, define them as JSON with a single card template.

```html
<div data-next-package-toggle
     data-next-packages='[
       {"packageId": 201, "label": "2-Year Warranty"},
       {"packageId": 202, "label": "Shipping Insurance", "selected": true},
       {"packageId": 203, "label": "Premium Gift Wrap"}
     ]'
     data-next-toggle-template-id="addon-tpl">
</div>

<template id="addon-tpl">
  <div data-next-toggle-card
       data-add-text="Add {toggle.label}"
       data-remove-text="✓ {toggle.label} Added">
    <img data-next-toggle-image alt="{toggle.label}" />
    <h3>{toggle.label}</h3>
    <span data-next-toggle-display="price"></span>
    <del data-next-toggle-display="originalPrice"></del>
  </div>
</template>
```

Set `"selected": true` in a JSON entry to auto-add that add-on on load.

## Step 6: Single-Button Toggle

When you only need a button and no card wrapper, place `data-next-package-toggle` directly on the button:

```html
<button data-next-package-toggle
        data-next-package-id="201"
        data-add-text="+ Add 2-Year Warranty — $9.99"
        data-remove-text="✓ Warranty Added — Remove">
  + Add 2-Year Warranty — $9.99
</button>
```

All state classes (`next-in-cart`, `next-not-in-cart`) are applied directly to the button. The button text switches automatically between the add and remove values.

## Step 7: Quantity Sync (Warranty Per Unit)

When your add-on quantity should match the main product quantity — for example, one warranty unit per bottle — use `data-next-package-sync`.

```html
<!-- Main product: packages 10 (1 bottle), 11 (3 bottles), 12 (6 bottles) -->
<div data-next-package-selector data-next-selector-id="qty">
  <div data-next-selector-card data-next-package-id="10" data-next-selected="true">1 Bottle</div>
  <div data-next-selector-card data-next-package-id="11">3 Bottles</div>
  <div data-next-selector-card data-next-package-id="12">6 Bottles</div>
</div>

<!-- Warranty: quantity mirrors whichever main package is in cart -->
<div data-next-package-toggle>
  <div data-next-toggle-card
       data-next-package-id="201"
       data-next-package-sync="10,11,12"
       data-add-text="Add Warranty (matches your quantity)"
       data-remove-text="✓ Warranty Added">
    Add Warranty
    <span data-next-toggle-display="price"></span>
  </div>
</div>
```

The toggle card's quantity is automatically set to the **sum of quantities** of the listed packages in the cart. When all synced packages are removed from the cart, the warranty is automatically removed too.

## Full Example

```html
<!-- Add-on section -->
<section class="addons">
  <h2>Protect Your Purchase</h2>

  <div data-next-package-toggle
       data-next-packages='[
         {"packageId": 201, "label": "2-Year Warranty", "description": "Full parts & labor coverage"},
         {"packageId": 202, "label": "Shipping Insurance", "description": "Covers loss or damage in transit", "selected": true}
       ]'
       data-next-toggle-template-id="addon-card-tpl">
  </div>
</section>

<template id="addon-card-tpl">
  <div class="addon-card" data-next-toggle-card
       data-add-text="Add"
       data-remove-text="✓ Added">
    <div class="addon-info">
      <img data-next-toggle-image alt="{toggle.label}" />
      <div>
        <h3>{toggle.label}</h3>
        <p>{toggle.description}</p>
      </div>
    </div>
    <div class="addon-price">
      <span data-next-toggle-display="price"></span>
      <del data-next-toggle-display="originalPrice"></del>
    </div>
    <button class="addon-button">
      <span data-next-button-text>Add</span>
    </button>
  </div>
</template>

<style>
  .addon-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    cursor: pointer;
  }
  .addon-card.next-in-cart {
    border-color: #16a34a;
    background: #f0fdf4;
  }
  .addon-info { flex: 1 }
  .addon-button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid currentColor;
  }
  .next-in-cart .addon-button {
    background: #16a34a;
    color: white;
  }
</style>
```

## Listening to Add-on Events

```javascript
window.nextReady.push(() => {
  window.next.on('toggle:toggled', ({ packageId, added }) => {
    if (added) {
      console.log('Add-on added:', packageId);
    } else {
      console.log('Add-on removed:', packageId);
    }
  });
});
```
