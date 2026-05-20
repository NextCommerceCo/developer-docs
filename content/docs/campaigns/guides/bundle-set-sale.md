---
title: Bundle Set Sale
---

Use the Bundle Selector to offer visitors pre-built product sets — Buy 1, Buy 2, Buy 3, or any fixed combination — where clicking a card instantly swaps the cart to that bundle. Prices are fetched from the backend so offer conditions and coupon discounts are always reflected accurately.

## What You're Building

A "Buy 1 / Buy 2 / Buy 3" selector where:
- Each option is a card the visitor clicks to select
- Selecting a card immediately replaces the previous bundle in the cart (atomic swap — no double-add)
- Each card shows a backend-calculated total price with optional savings
- Per-bundle discount codes are applied/removed automatically when the visitor switches

## Step 1: Basic Bundle Cards

The simplest setup is writing cards directly in HTML. Give each card a unique `data-next-bundle-id` and list the packages it contains.

```html
<div data-next-bundle-selector>

  <div data-next-bundle-card
       data-next-bundle-id="buy1"
       data-next-bundle-items='[{"packageId": 10, "quantity": 1}]'
       data-next-selected="true">
    <h3>Buy 1</h3>
    <p><span data-next-bundle-display="price"></span></p>
  </div>

  <div data-next-bundle-card
       data-next-bundle-id="buy2"
       data-next-bundle-items='[{"packageId": 10, "quantity": 2}]'>
    <h3>Buy 2</h3>
    <p><span data-next-bundle-display="price"></span></p>
    <p>Save <span data-next-bundle-display="discountAmount"></span></p>
  </div>

  <div data-next-bundle-card
       data-next-bundle-id="buy3"
       data-next-bundle-items='[{"packageId": 10, "quantity": 3}]'>
    <h3>Buy 3</h3>
    <p><span data-next-bundle-display="price"></span></p>
    <p>Save <span data-next-bundle-display="discountAmount"></span></p>
    <del><span data-next-bundle-display="originalPrice"></span></del>
  </div>

</div>
```

`data-next-selected="true"` on the first card pre-selects it and adds it to the cart on page load.

## Step 2: Add Styling for the Selected State

The enhancer adds CSS classes you can target:

```css
/* All cards */
.next-bundle-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
}

/* Selected card */
.next-bundle-card.next-selected {
  border-color: #2563eb;
  background: #eff6ff;
}

/* Price is loading */
.next-bundle-card.next-loading [data-next-bundle-display] {
  opacity: 0.4;
}
```

## Step 3: Per-Bundle Discount Codes

If you have coupon codes specific to each bundle size, declare them on the card. When the visitor switches bundles the old code is removed and the new one is applied — automatically.

```html
<div data-next-bundle-card
     data-next-bundle-id="buy2"
     data-next-bundle-items='[{"packageId": 10, "quantity": 2}]'
     data-next-bundle-vouchers="SAVE10">
  Buy 2 — 10% Off
</div>

<div data-next-bundle-card
     data-next-bundle-id="buy3"
     data-next-bundle-items='[{"packageId": 10, "quantity": 3}]'
     data-next-bundle-vouchers="SAVE20">
  Buy 3 — 20% Off
</div>
```

:::caution
Do not also manage these codes via `CouponEnhancer`. The bundle selector owns the voucher lifecycle for codes declared with `data-next-bundle-vouchers`.
:::

## Step 4: Auto-Render Mode

When you have more than 2–3 options or want to keep HTML lean, define bundles as JSON and write a single card template.

```html
<div data-next-bundle-selector
     data-next-bundle-template-id="bundle-card-tpl"
     data-next-bundles='[
       {"id":"buy1","label":"Buy 1","sublabel":"Regular price","items":[{"packageId":10,"quantity":1}]},
       {"id":"buy2","label":"Buy 2","sublabel":"Save 10%","items":[{"packageId":10,"quantity":2}],"vouchers":["SAVE10"]},
       {"id":"buy3","label":"Buy 3","sublabel":"Best value","badge":"Most Popular","items":[{"packageId":10,"quantity":3}],"vouchers":["SAVE20"]}
     ]'>
</div>

<template id="bundle-card-tpl">
  <div data-next-bundle-card data-next-bundle-id="{bundle.id}">
    <span class="badge">{bundle.badge}</span>
    <h3>{bundle.label}</h3>
    <p class="sublabel">{bundle.sublabel}</p>
    <p class="price"><span data-next-bundle-display="price"></span></p>
    <p class="savings">Save <span data-next-bundle-display="discountAmount"></span></p>
    <del><span data-next-bundle-display="originalPrice"></span></del>
  </div>
</template>
```

Any field in the JSON definition is available as `{bundle.<fieldName>}` in the template.

## Step 5: Multi-Product Bundles

A bundle can include more than one product. List each package in the `items` array.

```html
<div data-next-bundle-selector>

  <!-- Single product -->
  <div data-next-bundle-card
       data-next-bundle-id="solo"
       data-next-bundle-items='[{"packageId": 10, "quantity": 1}]'
       data-next-selected="true">
    Just the Main Product
    <span data-next-bundle-display="price"></span>
  </div>

  <!-- Main product + free gift (hidden from slot list) -->
  <div data-next-bundle-card
       data-next-bundle-id="with-gift"
       data-next-bundle-items='[
         {"packageId": 10, "quantity": 1},
         {"packageId": 99, "quantity": 1, "noSlot": true}
       ]'>
    Main Product + Free Gift
    <span data-next-bundle-display="price"></span>
  </div>

</div>
```

`"noSlot": true` adds the package to the cart silently — no slot row is rendered for it.

## Step 6: Variant Selection Per Slot

When your products have variants (color, size), add a slot template so visitors can configure each item in the bundle independently.

```html
<div data-next-bundle-selector
     data-next-bundle-slot-template-id="slot-tpl">

  <div data-next-bundle-card
       data-next-bundle-id="duo"
       data-next-bundle-items='[{"packageId": 10, "quantity": 2, "configurable": true}]'
       data-next-selected="true">
    <h3>Buy 2 — Pick Your Colors</h3>
    <div data-next-bundle-slots></div>
    <p>Total: <span data-next-bundle-display="price"></span></p>
  </div>

</div>

<template id="slot-tpl">
  <div class="slot-row">
    <img src="{item.image}" alt="{item.name}" />
    <strong>Unit {slot.unitNumber}</strong>
    <div data-next-variant-selectors></div>
  </div>
</template>
```

`"configurable": true` expands a quantity-2 item into 2 individual slots, each with its own variant dropdowns. Without it, the item renders as a single slot with one set of dropdowns that applies to all units.

## Full Example

```html
<!-- Bundle selector -->
<div class="bundle-selector"
     data-next-bundle-selector
     data-next-bundle-template-id="bundle-tpl"
     data-next-bundles='[
       {
         "id": "buy1",
         "label": "Buy 1",
         "badge": "",
         "items": [{"packageId": 10, "quantity": 1}]
       },
       {
         "id": "buy2",
         "label": "Buy 2",
         "badge": "Popular",
         "items": [{"packageId": 10, "quantity": 2}],
         "vouchers": ["SAVE10"]
       },
       {
         "id": "buy3",
         "label": "Buy 3",
         "badge": "Best Value",
         "items": [{"packageId": 10, "quantity": 3}],
         "vouchers": ["SAVE20"]
       }
     ]'>
</div>

<template id="bundle-tpl">
  <div data-next-bundle-card data-next-bundle-id="{bundle.id}">
    <span class="badge">{bundle.badge}</span>
    <h3>{bundle.label}</h3>
    <div class="pricing">
      <span data-next-bundle-display="price"></span>
      <del data-next-bundle-display="originalPrice"></del>
    </div>
    <p class="savings">You save <span data-next-bundle-display="discountAmount"></span></p>
  </div>
</template>

<style>
  .bundle-selector {
    display: flex;
    gap: 1rem;
  }
  [data-next-bundle-card] {
    flex: 1;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.25rem;
    cursor: pointer;
    position: relative;
  }
  [data-next-bundle-card].next-selected {
    border-color: #2563eb;
    background: #eff6ff;
  }
  .badge:empty {
    display: none;
  }
  /* Hide savings row when there are none */
  [data-next-bundle-card].next-loading .pricing {
    opacity: 0.5;
  }
</style>
```

## Reacting to Bundle Changes

```javascript
window.nextReady.push(() => {
  window.next.on('bundle:selection-changed', ({ bundleId, items }) => {
    console.log('Switched to bundle:', bundleId);
    // items = [{ packageId, quantity }, ...]
  });
});
```
