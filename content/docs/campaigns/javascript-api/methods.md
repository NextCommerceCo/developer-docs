---
title: JavaScript API Methods
sidebar_label: Methods
sidebar_position: 2
---

Complete reference for all JavaScript methods available in the Campaign Cart SDK.

## Getting Started

The SDK exposes methods through the `window.next` object after initialization.

### Initialization Detection

```javascript
// Check if SDK is ready
if (window.next) {
  // SDK is ready, use it directly
  next.addItem({ packageId: 1 });
} else {
  // Queue for later execution
  window.nextReady = window.nextReady || [];
  window.nextReady.push(function() {
    next.addItem({ packageId: 1 });
  });
}

// Or listen for initialization event
document.addEventListener('next:initialized', function(event) {
  // SDK is ready
  console.log('SDK initialized at', new Date(event.detail.timestamp));
  next.addItem({ packageId: 1 });
});
```

## Table of Contents

- [Cart Methods](#cart-methods)
- [Campaign & Package Methods](#campaign--package-methods)
- [Coupon Methods](#coupon-methods)
- [Shipping Methods](#shipping-methods)
- [Tracking & Analytics Methods](#tracking--analytics-methods)
- [Upsell Methods](#upsell-methods)
- [Event Methods](#event-methods)
- [Utility Methods](#utility-methods)
- [Debug API](#debug-api)

## Cart Methods

### addItem

Adds an item to the cart. **Note: This method requires an options object, not a direct package ID.**

```javascript
// ✅ CORRECT - Pass an object with packageId property
await next.addItem({ 
  packageId: 123, 
  quantity: 2 
});

// ✅ CORRECT - Quantity is optional (defaults to 1)
await next.addItem({ packageId: 123 });

// ❌ WRONG - Don't pass packageId directly
// next.addItem(123); // This won't work!
```

**Parameters:**
- `options` (object): Required options object
  - `options.packageId` (number): Package ID to add
  - `options.quantity` (number, optional): Quantity to add (default: 1)

**Returns:** `Promise<void>`

### removeItem

Removes an item from the cart. **Requires an options object.**

```javascript
// ✅ CORRECT
await next.removeItem({ packageId: 123 });

// ❌ WRONG
// next.removeItem(123); // This won't work!
```

**Parameters:**
- `options` (object): Required options object
  - `options.packageId` (number): Package ID to remove

**Returns:** `Promise<void>`

### updateQuantity

Updates the quantity of an item in the cart. **Requires an options object.**

```javascript
// ✅ CORRECT
await next.updateQuantity({ 
  packageId: 123, 
  quantity: 5 
});

// ❌ WRONG
// next.updateQuantity(123, 5); // This won't work!
```

**Parameters:**
- `options` (object): Required options object
  - `options.packageId` (number): Package ID to update
  - `options.quantity` (number): New quantity

**Returns:** `Promise<void>`

### clearCart

Removes all items from the cart.

```javascript
await next.clearCart();
```

**Returns:** `Promise<void>`

> **Note:** after a successful checkout the SDK automatically resets the cart and checkout state (items, vouchers, shipping method, form data, payment token, billing address) before redirecting to the success URL. You only need to call `clearCart()` manually for custom flows — for example, inside an `order:redirect-missing` handler where the automatic reset is skipped so you can recover.

### hasItemInCart

Checks if an item is in the cart. **Requires an options object.**

```javascript
// ✅ CORRECT
const hasItem = next.hasItemInCart({ packageId: 123 });
console.log('Item in cart:', hasItem); // true or false

// ❌ WRONG
// next.hasItemInCart(123); // This won't work!
```

**Parameters:**
- `options` (object): Required options object
  - `options.packageId` (number): Package ID to check

**Returns:** `boolean`

### getCartData

Returns comprehensive cart data including enriched items, totals, campaign data, and applied coupons.

```javascript
const cartData = next.getCartData();
console.log(cartData);
// {
//   cartLines: [...],
//   cartTotals: { subtotal: {...}, total: {...}, ... },
//   campaignData: {...},
//   appliedCoupons: [...]
// }
```

**Returns:**
```typescript
{
  cartLines: EnrichedCartLine[];
  cartTotals: CartTotals;
  campaignData: Campaign | null;
  appliedCoupons: AppliedCoupon[];
}
```

### getCartTotals

Returns cart totals and pricing information.

```javascript
const totals = next.getCartTotals();
console.log('Total:', totals.total.formatted); // "$99.99"
console.log('Subtotal:', totals.subtotal.formatted); // "$89.99"
console.log('Shipping:', totals.shipping.formatted); // "$10.00"
```

**Returns:** `CartTotals` object with subtotal, shipping, tax, discounts, and total

### getCartCount

Returns the total number of items in the cart.

```javascript
const count = next.getCartCount();
console.log('Items in cart:', count); // 3
```

**Returns:** `number`

## Campaign & Package Methods

### getCampaignData

Returns the loaded campaign data.

```javascript
const campaign = next.getCampaignData();
if (campaign) {
  console.log('Campaign:', campaign.name);
  console.log('Currency:', campaign.currency);
  console.log('Packages:', campaign.packages);
  console.log('Available payment methods:', campaign.available_payment_methods);
  console.log('Available express payment methods:', campaign.available_express_payment_methods);
}
```

**Returns:** `Campaign | null` including packages, settings, currency, and available payment method fields

### getPackage

Gets detailed information about a specific package.

```javascript
const package = next.getPackage(123);
if (package) {
  console.log('Package name:', package.display_name);
  console.log('Price:', next.formatPrice(package.price));
}
```

**Parameters:**
- `id` (number): Package ID

**Returns:** `Package | null`

## Coupon Methods

### applyCoupon

Applies a coupon code to the cart.

```javascript
const result = await next.applyCoupon('SAVE20');
if (result.success) {
  console.log('Coupon applied:', result.message);
  console.log('Discount amount:', result.data.amount);
} else {
  console.error('Coupon error:', result.message);
}
```

**Parameters:**
- `code` (string): Coupon code to apply

**Returns:**
```typescript
Promise<{
  success: boolean;
  message: string;
  data?: { amount: number; formatted: string; }
}>
```

### removeCoupon

Removes a coupon from the cart.

```javascript
next.removeCoupon('SAVE20');
```

**Parameters:**
- `code` (string): Coupon code to remove

**Returns:** `void`

### getCoupons

Returns all applied coupons.

```javascript
const coupons = next.getCoupons();
coupons.forEach(coupon => {
  console.log(`${coupon.code}: ${coupon.amount.formatted} off`);
});
```

**Returns:** `AppliedCoupon[]`

### validateCoupon

Validates a coupon without applying it.

```javascript
const validation = next.validateCoupon('TESTCODE');
if (validation.valid) {
  console.log('Coupon is valid');
} else {
  console.log('Invalid:', validation.message);
}
```

**Parameters:**
- `code` (string): Coupon code to validate

**Returns:**
```typescript
{
  valid: boolean;
  message?: string;
}
```

### calculateDiscountAmount

Calculates the discount amount for a given coupon definition.

```javascript
const amount = next.calculateDiscountAmount(couponDefinition);
console.log('Discount amount:', amount);
```

**Parameters:**
- `coupon` (DiscountDefinition): Coupon definition object

**Returns:** `number` - Calculated discount amount

## Shipping Methods

### getShippingMethods

Returns all available shipping methods from the campaign.

```javascript
const methods = next.getShippingMethods();
console.log(methods);
// [
//   {ref_id: 1, code: "standard", price: "0.00"},
//   {ref_id: 2, code: "express", price: "12.99"}
// ]
```

**Returns:** `Array&lt;{ref_id: number; code: string; price: string}&gt;`

### getSelectedShippingMethod

Returns the currently selected shipping method.

```javascript
const selected = next.getSelectedShippingMethod();
if (selected) {
  console.log('Shipping:', selected.name, selected.price);
}
```

**Returns:** `{id: number; name: string; price: number; code: string} | null`

### setShippingMethod

Sets the shipping method by ID.

```javascript
// Set standard shipping (ID 1)
await next.setShippingMethod(1);

// Set express shipping (ID 2)
await next.setShippingMethod(2);
```

**Parameters:**
- `methodId` (number): The ref_id of the shipping method from campaign data

**Returns:** `Promise<void>`

**Throws:** Error if shipping method ID is not found in campaign data

## Tracking & Analytics Methods

### trackViewItemList

Tracks when users view a list of products.

```javascript
// Basic tracking
await next.trackViewItemList(['1', '2', '3']);

// With list context
await next.trackViewItemList(
  ['1', '2', '3'], 
  'homepage', 
  'Featured Products'
);
```

**Parameters:**
- `packageIds` (Array&lt;string\|number&gt;): Array of package IDs
- `listId` (string, optional): Unique list identifier
- `listName` (string, optional): Human-readable list name

**Returns:** `Promise<void>`

### trackViewItem

Tracks when a single item is viewed.

```javascript
await next.trackViewItem('1');
```

**Parameters:**
- `packageId` (string\|number): Package ID viewed

**Returns:** `Promise<void>`

### trackAddToCart

Tracks when an item is added to cart.

```javascript
await next.trackAddToCart('1', 2);
```

**Parameters:**
- `packageId` (string\|number): Package ID added
- `quantity` (number, optional): Quantity added (default: 1)

**Returns:** `Promise<void>`

### trackRemoveFromCart

Tracks when an item is removed from cart.

```javascript
await next.trackRemoveFromCart('1', 1);
```

**Parameters:**
- `packageId` (string\|number): Package ID removed
- `quantity` (number, optional): Quantity removed (default: 1)

**Returns:** `Promise<void>`

### trackBeginCheckout

Tracks when checkout process begins.

```javascript
await next.trackBeginCheckout();
```

**Returns:** `Promise<void>`

### trackPurchase

Tracks completed purchases.

```javascript
// Track with order data
await next.trackPurchase(orderData);
```

**Parameters:**
- `orderData` (any): Order data object

**Returns:** `Promise<void>`

### trackCustomEvent

Tracks custom events with optional data.

```javascript
// Simple custom event
await next.trackCustomEvent('video_played');

// Custom event with data
await next.trackCustomEvent('user_engagement', {
  section: 'hero',
  action: 'video_play',
  duration: 30
});
```

**Parameters:**
- `eventName` (string): Custom event name
- `data` (Record&lt;string, any&gt;, optional): Additional event data

**Returns:** `Promise<void>`

### trackSignUp

Tracks user sign-up events.

```javascript
await next.trackSignUp('user@example.com');
```

**Parameters:**
- `email` (string): User's email address

**Returns:** `Promise<void>`

### trackLogin

Tracks user login events.

```javascript
await next.trackLogin('user@example.com');
```

**Parameters:**
- `email` (string): User's email address

**Returns:** `Promise<void>`

### setDebugMode (Analytics)

Enables or disables analytics debug mode.

```javascript
await next.setDebugMode(true); // Enable debug logging
```

**Parameters:**
- `enabled` (boolean): Enable or disable debug mode

**Returns:** `Promise<void>`

### invalidateAnalyticsContext

Invalidates the analytics context, useful when switching between pages.

```javascript
await next.invalidateAnalyticsContext();
```

**Returns:** `Promise<void>`

## Upsell Methods

### addUpsell

Adds upsell items to a completed order. Only available after order completion.

```javascript
// Add single upsell
const result = await next.addUpsell({ 
  packageId: 123, 
  quantity: 1 
});

// Add multiple upsells at once
const result = await next.addUpsell({ 
  items: [
    { packageId: 123, quantity: 1 },
    { packageId: 456, quantity: 2 }
  ]
});

console.log('Upsells added:', result.addedLines);
console.log('Total upsell value:', result.totalValue);
```

**Parameters:**
- `options.packageId` (number, optional): Single package ID to add
- `options.quantity` (number, optional): Quantity for single item (default: 1)
- `options.items` (Array, optional): Multiple items to add
  - `items[].packageId` (number): Package ID
  - `items[].quantity` (number, optional): Quantity (default: 1)

**Returns:**
```typescript
Promise<{
  order: Order;
  addedLines: OrderLine[];
  totalValue: number;
}>
```

**Throws:** Error if no order exists or order doesn't support upsells

### canAddUpsells

Checks if upsells can be added to the current order.

```javascript
if (next.canAddUpsells()) {
  console.log('Order supports upsells');
}
```

**Returns:** `boolean`

### getCompletedUpsells

Returns array of package IDs that have been added as upsells.

```javascript
const completedUpsells = next.getCompletedUpsells();
console.log('Upsells added:', completedUpsells); // ['123', '456']
```

**Returns:** `string[]`

### isUpsellAlreadyAdded

Checks if a specific package has already been added as an upsell.

```javascript
if (next.isUpsellAlreadyAdded(123)) {
  console.log('This upsell was already added');
}
```

**Parameters:**
- `packageId` (number): Package ID to check

**Returns:** `boolean`

## Event Methods

### on

Subscribe to internal SDK events.

```javascript
// Listen for cart updates
next.on('cart:updated', (cartState) => {
  console.log('Cart updated:', cartState.items.length, 'items');
});

// Listen for item additions
next.on('cart:item-added', (data) => {
  console.log('Item added:', data.packageId);
});
```

**Parameters:**
- `event` (string): Event name from EventMap
- `handler` (function): Event handler function

**Returns:** `void`

**Example:**
```javascript
// Subscribe to multiple events
next.on('cart:item-added', (data) => {
  showNotification(`${data.packageName} added to cart`);
});

next.on('order:completed', (order) => {
  trackConversion(order);
});
```

### off

Unsubscribe from internal SDK events.

```javascript
const handler = (data) => console.log(data);

// Add listener
next.on('cart:updated', handler);

// Later, remove listener
next.off('cart:updated', handler);
```

**Parameters:**
- `event` (string): Event name
- `handler` (function): Handler function to remove (must be the same function reference)

**Returns:** `void`

**Example:**
```javascript
// Store handler reference for cleanup
const cartHandler = (data) => {
  updateCartUI(data);
};

// Subscribe
next.on('cart:updated', cartHandler);

// Later, when component unmounts
next.off('cart:updated', cartHandler);
```

For a complete list of all 34 available events, event data structures, initialization callbacks, and best practices, see the [Events Reference](/docs/campaigns/javascript-api/events).

## Utility Methods

### formatPrice

Formats a price value according to campaign currency.

```javascript
const formatted = next.formatPrice(19.99); // "$19.99"
const euros = next.formatPrice(19.99, 'EUR'); // "€19.99"
```

**Parameters:**
- `amount` (number): Price amount to format
- `currency` (string, optional): Currency code (uses campaign currency if not provided)

**Returns:** `string`

### validateCheckout

Validates if the cart is ready for checkout.

```javascript
const validation = next.validateCheckout();
if (!validation.valid) {
  console.error('Cannot checkout:', validation.errors);
}
```

**Returns:**
```typescript
{
  valid: boolean;
  errors?: string[];
}
```

## Debug API

The debug API provides powerful utilities for development and troubleshooting. Available only when debug mode is enabled with `?debugger=true`.

### Accessing Debug Mode

```javascript
// Check if debug mode is available
if (window.nextDebug) {
  console.log('Debug mode available');
}
```

### Store Access

Direct access to all internal stores:

```javascript
// Cart store
const cartState = nextDebug.stores.cart.getState();
console.log('Cart items:', cartState.items);

// Campaign store
const campaignState = nextDebug.stores.campaign.getState();
console.log('Campaign data:', campaignState.data);

// Config store
const configState = nextDebug.stores.config.getState();
console.log('API key:', configState.apiKey);

// Checkout store
const checkoutState = nextDebug.stores.checkout.getState();

// Order store
const orderState = nextDebug.stores.order.getState();

// Attribution store
const attributionState = nextDebug.stores.attribution.getState();
```

### Cart Debug Methods

```javascript
// Quick cart operations
nextDebug.addToCart(123);        // Add single item
nextDebug.addToCart(123, 3);     // Add with quantity
nextDebug.removeFromCart(123);   // Remove item
nextDebug.updateQuantity(123, 5); // Update quantity

// Add test items (packages 2, 7, 9)
nextDebug.addTestItems();
```

### Campaign Debug Methods

```javascript
// Reload campaign data
await nextDebug.loadCampaign();

// Clear campaign cache
nextDebug.clearCampaignCache();

// Get cache information
const cacheInfo = nextDebug.getCacheInfo();

// Inspect specific package
nextDebug.inspectPackage(123);

// Test shipping methods
await nextDebug.testShippingMethod(1);
```

### Analytics Debug Methods

```javascript
// Get analytics status
const status = await nextDebug.analytics.getStatus();

// Get loaded providers
const providers = await nextDebug.analytics.getProviders();

// Track test event
await nextDebug.analytics.track('test_event', { test: true });

// Enable analytics debug mode
await nextDebug.analytics.setDebugMode(true);

// Invalidate analytics context
await nextDebug.analytics.invalidateContext();
```

### Attribution Debug Methods

```javascript
// Debug attribution data
nextDebug.attribution.debug();

// Get attribution for API
const attribution = nextDebug.attribution.get();

// Set funnel name
nextDebug.attribution.setFunnel('debug-funnel');

// Set Everflow click ID
nextDebug.attribution.setEvclid('test-evclid-123');

// Get current funnel
const funnel = nextDebug.attribution.getFunnel();

// Clear persisted funnel
nextDebug.attribution.clearFunnel();
```

### System Debug Methods

```javascript
// Direct SDK access
nextDebug.sdk.addItem({ packageId: 123 });

// Get initialization stats
const stats = nextDebug.getStats();

// Reinitialize SDK
await nextDebug.reinitialize();

// Test mode manager
nextDebug.testMode.enable();
nextDebug.testMode.disable();
nextDebug.testMode.getConfig();
```

### Debug Overlay Control

```javascript
// Show/hide debug overlay
nextDebug.overlay.show();
nextDebug.overlay.hide();
nextDebug.overlay.toggle();

// Check visibility
const isVisible = nextDebug.overlay.isVisible();
```

## Related Documentation

- **[Utilities](/docs/campaigns/utilities)** - Exit intent and debugging tools
- **[Events](/docs/campaigns/javascript-api/events)** - Complete event system documentation
- **[Profiles API](/docs/campaigns/javascript-api/profiles)** - Profile-based package mapping
- **[Attribution API](/docs/campaigns/javascript-api/attribution)** - Attribution tracking
- **[URL Parameters API](/docs/campaigns/javascript-api/url-parameters)** - URL parameter management
- **[Data Attributes](/docs/campaigns/data-attributes)** - HTML attribute reference
