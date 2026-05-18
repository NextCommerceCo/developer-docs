---
title: Attribution API
sidebar_position: 4
---

The SDK provides comprehensive attribution tracking capabilities, including support for custom metadata that can be passed with orders.

> **Prerequisites:** Your store must have the [required metadata field definitions](/docs/campaigns/javascript-api/attribution-metadata) configured in Settings → Metadata before attribution data will flow with orders. Missing fields are silently dropped.

## Simple API via window.next

The easiest way to manage attribution metadata is through the `window.next` object:

```javascript
// Add or update a single metadata field
window.next.addMetadata('campaign_id', 'SUMMER2025');
window.next.addMetadata('influencer_code', 'JANE123');

// Set multiple metadata fields at once
window.next.setMetadata({
  campaign_id: 'SUMMER2025',
  influencer_code: 'JANE123',
  test_variant: 'hero_b',
  source_platform: 'instagram'
});

// Get current metadata
const metadata = window.next.getMetadata();
console.log(metadata);

// Clear all custom metadata (preserves automatic fields)
window.next.clearMetadata();

// Set complete attribution data (including standard fields)
window.next.setAttribution({
  utm_source: 'instagram',
  utm_campaign: 'summer2025',
  affiliate: 'partner123',
  metadata: {
    custom_field: 'value'
  }
});

// Get current attribution that will be sent with orders
const attribution = window.next.getAttribution();
console.log(attribution);

// Debug attribution data in console
window.next.debugAttribution();
```

## Attribution Object Structure

When orders are created, the SDK sends attribution data in the following format:

```typescript
interface Attribution {
  affiliate?: string;
  funnel?: string;
  gclid?: string;
  metadata?: Record<string, any>;  // Custom metadata object
  subaffiliate1?: string;
  subaffiliate2?: string;
  subaffiliate3?: string;
  subaffiliate4?: string;
  subaffiliate5?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_medium?: string;
  utm_source?: string;
  utm_term?: string;
  everflow_transaction_id?: string;
}
```

## Accessing Attribution Store

The attribution store is available globally after SDK initialization:

```javascript
// Access via window object
window.NextAttributionStore

// Or via NextStores
const { useAttributionStore } = window.NextStores;
const attributionStore = useAttributionStore.getState();
```

## Methods

### updateAttribution(data)

Updates attribution data including custom metadata.

```javascript
window.NextAttributionStore.updateAttribution({
  affiliate: 'partner_123',
  utm_source: 'instagram',
  metadata: {
    custom_field: 'value',
    tracking_id: 'abc123'
  }
});
```

**Parameters:**
- `data` (Partial&lt;AttributionState&gt;): Object containing attribution fields to update

### getAttributionForApi()

Returns the current attribution data formatted for API submission.

```javascript
const attribution = window.NextAttributionStore.getAttributionForApi();
console.log(attribution);
// Output: { affiliate: '...', metadata: {...}, utm_source: '...', ... }
```

**Returns:** Attribution object ready for API

### setFunnelName(funnel)

Sets the funnel name for attribution tracking. Once set, it persists and cannot be overwritten.

```javascript
window.NextAttributionStore.setFunnelName('summer_sale_2025');
```

**Parameters:**
- `funnel` (string): The funnel identifier

### setEverflowClickId(evclid)

Sets the Everflow click ID for tracking.

```javascript
window.NextAttributionStore.setEverflowClickId('ef_click_12345');
```

**Parameters:**
- `evclid` (string): Everflow click identifier

### debug()

Outputs detailed attribution information to the console for debugging.

```javascript
window.NextAttributionStore.debug();
// Logs comprehensive attribution data to console
```

### clearPersistedFunnel()

Clears the persisted funnel name from storage.

```javascript
window.NextAttributionStore.clearPersistedFunnel();
```

## Custom Metadata

The `metadata` field accepts any custom properties you need to track with orders.

### Automatic Metadata Collection

The SDK automatically collects these metadata fields:

```javascript
{
  landing_page: string;      // Entry page URL
  referrer: string;          // Referring URL
  device: string;            // Device info
  device_type: 'mobile' | 'desktop' | 'tablet';
  domain: string;            // Current domain
  timestamp: number;         // Visit timestamp
  conversion_timestamp?: number;
  
  // Facebook tracking (when available)
  fb_fbp?: string;
  fb_fbc?: string;
  fb_pixel_id?: string;
  fbclid?: string;
  
  // Everflow tracking (when available)
  everflow_transaction_id?: string;
}
```

### Adding Custom Metadata

Add any custom tracking data your business requires:

```javascript
window.NextAttributionStore.updateAttribution({
  metadata: {
    // Marketing campaign data
    campaign_id: 'SUMMER2025',
    campaign_version: 'v2',
    creative_id: 'hero_banner_b',
    
    // Partner/Influencer tracking
    influencer_code: 'JANE123',
    partner_id: 'partner_456',
    commission_tier: 'gold',
    
    // Platform-specific IDs
    tiktok_click_id: 'ttc_abc123',
    pinterest_id: 'pin_xyz789',
    snapchat_id: 'snap_456',
    reddit_campaign: 'sponsored_post_789',
    
    // A/B testing
    test_group: 'variant_b',
    test_id: 'homepage_hero_test',
    
    // Geographic/Store data
    store_location: 'NYC_flagship',
    region: 'northeast',
    
    // Custom business logic
    customer_segment: 'vip',
    loyalty_tier: 'platinum',
    referral_program_id: 'friend_2025',
    
    // Nested objects are supported
    advanced_tracking: {
      session_id: 'sess_xyz',
      interaction_count: 5,
      time_on_site: 300
    }
  }
});
```

## Examples

### Example 1: E-commerce Platform Integration

```javascript
// Track marketplace attribution
function trackMarketplaceSource(marketplace, sellerId, listingId) {
  window.NextAttributionStore.updateAttribution({
    utm_source: marketplace,
    utm_medium: 'marketplace',
    affiliate: sellerId,
    metadata: {
      marketplace_name: marketplace,
      seller_id: sellerId,
      listing_id: listingId,
      marketplace_category: 'electronics',
      marketplace_rank: 5,
      fulfilled_by: 'merchant',
      prime_eligible: true,
      promotion_type: 'lightning_deal'
    }
  });
}

// Usage
trackMarketplaceSource('amazon', 'SELLER123', 'B08XYZ123');
```

### Example 2: Multi-Touch Attribution

```javascript
// Track multiple touchpoints in customer journey
function trackTouchpoint(touchpointData) {
  const currentMetadata = window.NextAttributionStore.getAttributionForApi().metadata || {};
  
  // Append to touchpoint history
  const touchpoints = currentMetadata.touchpoints || [];
  touchpoints.push({
    timestamp: Date.now(),
    channel: touchpointData.channel,
    action: touchpointData.action,
    value: touchpointData.value
  });
  
  window.NextAttributionStore.updateAttribution({
    metadata: {
      ...currentMetadata,
      touchpoints: touchpoints,
      last_touchpoint: touchpointData.channel,
      touchpoint_count: touchpoints.length,
      attribution_model: 'linear' // or 'first_touch', 'last_touch', etc.
    }
  });
}

// Track various touchpoints
trackTouchpoint({ channel: 'email', action: 'opened', value: 'welcome_series' });
trackTouchpoint({ channel: 'social', action: 'clicked', value: 'instagram_story' });
trackTouchpoint({ channel: 'search', action: 'clicked', value: 'brand_term' });
```

### Example 3: Retail & Offline Attribution

```javascript
// Bridge offline and online attribution
function trackOfflineAttribution(storeData) {
  window.NextAttributionStore.updateAttribution({
    utm_source: 'retail',
    utm_medium: 'in_store',
    utm_campaign: storeData.campaign || 'store_visit',
    metadata: {
      // Store information
      store_id: storeData.storeId,
      store_name: storeData.storeName,
      store_region: storeData.region,
      store_type: storeData.type, // 'flagship', 'outlet', 'pop_up'
      
      // Staff attribution
      associate_id: storeData.associateId,
      associate_name: storeData.associateName,
      department: storeData.department,
      
      // In-store journey
      kiosk_used: storeData.kioskUsed,
      qr_scanned: storeData.qrScanned,
      fitting_room_tech: storeData.fittingRoomTech,
      
      // Transaction bridging
      in_store_cart_id: storeData.cartId,
      pos_system: 'square',
      store_promo_code: storeData.promoCode,
      
      // Customer experience
      appointment_booked: storeData.appointmentBooked,
      personal_shopper: storeData.personalShopper,
      curbside_pickup: false,
      
      // Timing
      store_visit_timestamp: storeData.visitTime,
      offline_to_online_hours: storeData.hoursSinceVisit
    }
  });
}
```

### Example 4: Content Attribution

```javascript
// Track content-driven conversions
function trackContentAttribution(contentData) {
  window.NextAttributionStore.updateAttribution({
    utm_source: contentData.platform,
    utm_medium: 'content',
    utm_campaign: contentData.campaign,
    utm_content: contentData.contentId,
    metadata: {
      // Content details
      content_type: contentData.type, // 'blog', 'video', 'podcast', 'webinar'
      content_id: contentData.contentId,
      content_title: contentData.title,
      content_author: contentData.author,
      content_category: contentData.category,
      publish_date: contentData.publishDate,
      
      // Engagement metrics
      read_time_seconds: contentData.readTime,
      scroll_depth: contentData.scrollDepth,
      video_watch_percentage: contentData.watchPercentage,
      
      // Content journey
      content_path: contentData.contentPath, // ['blog_1', 'video_2', 'product_page']
      content_touches: contentData.touches,
      
      // SEO/Discovery
      entry_keyword: contentData.keyword,
      discovery_method: contentData.discovery, // 'search', 'recommendation', 'social'
      
      // Monetization
      paywall_shown: contentData.paywallShown,
      subscription_prompt: contentData.subscriptionPrompt,
      native_ad_clicked: contentData.nativeAdClicked
    }
  });
}
```

## Attribution URL Parameters

The SDK automatically captures attribution data from URL parameters to track marketing campaigns, affiliate referrals, and conversion sources. This data is persisted throughout the user's session and included with all orders.

### Overview

Attribution parameters are:
- **Automatically captured** from URL query strings when the SDK initializes
- **Persisted** in sessionStorage throughout the user's session
- **URL parameters always override** any existing persisted values
- **Included automatically** in checkout and order API calls
- **Cross-page persistent** - navigate anywhere and attribution is preserved

### Core Attribution Parameters

#### Funnel

Identifies the marketing funnel or campaign flow.

**Parameter:** `funnel`

**Example:**
```text
https://yoursite.com/checkout?funnel=summer-sale-2024
```

**Usage:**
- Track different marketing funnels
- Identify which landing page or campaign the user came from
- Segment orders by funnel for reporting

**Behavior:**
- Can also be set via meta tags (URL parameter takes priority)
- Once set, persists across all pages in the session
- URL parameter will override any existing funnel value
- Also accepts `next.setAttribution({ funnel: 'funnel-name' })` programmatically

#### Affiliate ID

Tracks affiliate or partner referrals.

**Parameters:** `affid` or `aff` (both accepted)

**Example:**
```text
https://yoursite.com/product?affid=partner123
https://yoursite.com/product?aff=affiliate-xyz
```

**Usage:**
- Track affiliate commissions
- Attribute sales to specific partners
- Segment traffic by referral source

#### Google Click ID (GCLID)

Google Ads click identifier for conversion tracking.

**Parameter:** `gclid`

**Example:**
```text
https://yoursite.com/landing?gclid=EAIaIQobChMI7...
```

**Usage:**
- Google Ads conversion tracking
- Automatically captured from Google Ads campaigns
- Required for Google Ads conversion API

### UTM Parameters

Standard UTM tracking parameters for campaign analytics.

| Parameter | Description | Example |
|-----------|-------------|---------|
| `utm_source` | Identifies the source of traffic | `?utm_source=facebook` |
| `utm_medium` | Identifies the marketing medium | `?utm_medium=cpc` |
| `utm_campaign` | Identifies the specific campaign | `?utm_campaign=summer-sale-2024` |
| `utm_content` | Identifies specific ad or link content | `?utm_content=banner-ad-blue` |
| `utm_term` | Identifies paid search keywords | `?utm_term=weight+loss+supplement` |

**Complete UTM Example:**
```text
https://yoursite.com/product?utm_source=facebook&utm_medium=cpc&utm_campaign=summer-2024&utm_content=carousel-ad-1&utm_term=fitness
```

### Subaffiliate Tracking

Track up to 5 levels of sub-affiliate data for multi-tier affiliate programs.

**Parameters:** `subaffiliate1-5` or `sub1-5` (both formats accepted)

**Character Limit:** Each subaffiliate value is limited to 225 characters (automatically truncated with a warning)

**Examples:**
```text
https://yoursite.com/product?subaffiliate1=region-west&subaffiliate2=agent-123
https://yoursite.com/product?sub1=tier1&sub2=tier2&sub3=tier3
```

**Usage:**
- Multi-level marketing (MLM) tracking
- Regional affiliate tracking
- Sales team commission tracking
- Hierarchical partner structures

**Subaffiliate Levels:**
- `subaffiliate1` / `sub1` - Primary sub-affiliate
- `subaffiliate2` / `sub2` - Secondary level
- `subaffiliate3` / `sub3` - Tertiary level
- `subaffiliate4` / `sub4` - Fourth level
- `subaffiliate5` / `sub5` - Fifth level

### Click Tracking Parameters

#### Facebook Click ID (FBCLID)

Facebook Ads click identifier for conversion tracking.

**Parameter:** `fbclid`

**Example:**
```text
https://yoursite.com/landing?fbclid=IwAR1X...
```

**Usage:**
- Facebook Ads conversion tracking
- Automatically appended by Facebook to ad links
- Stored in attribution metadata

#### Everflow Click ID (EVCLID)

Everflow affiliate network tracking identifier.

**Parameter:** `evclid`

**Example:**
```text
https://yoursite.com/offer?evclid=123456789
```

**Usage:**
- Everflow affiliate network tracking
- Performance marketing attribution
- Stored as `everflow_transaction_id` in metadata

#### Generic Click ID

Generic click tracking for various platforms.

**Parameter:** `clickid`

**Example:**
```text
https://yoursite.com/product?clickid=abc123xyz
```

**Usage:**
- Custom tracking platforms
- Generic click tracking systems
- Platform-agnostic click attribution

### How Attribution Works

#### 1. Automatic Capture

When a user visits any page with attribution parameters:

```text
https://yoursite.com/landing?funnel=summer-sale&affid=partner123&utm_source=facebook
```

The SDK automatically:
- Captures all attribution parameters
- Stores them in sessionStorage
- Logs the capture event (visible with debug mode)

#### 2. Session Persistence

Once captured, attribution data persists throughout the session:

```text
Page 1: /landing?funnel=summer-sale&affid=partner123
Page 2: /products (no params)
Page 3: /checkout (no params)
```

All attribution data from Page 1 remains available on Pages 2 and 3.

#### 3. Parameter Override

URL parameters **always override** existing persisted values:

```text
Visit 1: ?funnel=spring-sale
  → Sets funnel to "spring-sale"

Visit 2: ?funnel=summer-sale
  → Overrides funnel to "summer-sale"
  → Logs: "🔄 Funnel override: 'spring-sale' -> 'summer-sale'"
```

#### 4. Order Inclusion

All captured attribution data is automatically included in:
- Cart creation API calls
- Checkout submission
- Order completion
- Upsell additions

### Common Use Cases

#### Affiliate Marketing Campaign
```text
https://yoursite.com/offer?affid=partner123&subaffiliate1=region-west&subaffiliate2=agent-456
```

Tracks:
- Affiliate partner
- Region/territory
- Individual sales agent

#### Facebook Ad Campaign
```text
https://yoursite.com/product?funnel=fb-summer-campaign&utm_source=facebook&utm_medium=cpc&utm_campaign=summer-2024&fbclid=IwAR1X...
```

Tracks:
- Campaign funnel
- UTM parameters for analytics
- Facebook click ID for conversion tracking

#### Google Ads Campaign
```text
https://yoursite.com/landing?funnel=google-search&utm_source=google&utm_medium=cpc&utm_campaign=brand-terms&gclid=EAIaIQobChMI7...
```

Tracks:
- Search campaign funnel
- UTM parameters
- Google click ID for conversion API

#### Email Marketing
```text
https://yoursite.com/exclusive?funnel=vip-email&utm_source=newsletter&utm_medium=email&utm_campaign=monthly-2024-06&utm_content=hero-cta
```

Tracks:
- Email funnel
- Newsletter source
- Specific email campaign
- Which CTA was clicked

#### Multi-Tier Affiliate Program
```text
https://yoursite.com/product?affid=network1&sub1=master-affiliate&sub2=sub-affiliate&sub3=sales-rep&sub4=region&sub5=channel
```

Tracks complete affiliate hierarchy for commission distribution.

### Meta Tag Support

Attribution can also be set via meta tags (URL parameters take priority):

```html
<!-- Funnel name -->
<meta name="next-funnel" content="landing-page-a">

<!-- Or using tracking tag format -->
<meta name="data-next-tracking-tag" data-tag-name="funnel_name" data-tag-value="landing-page-a">
```

**Priority Order:**
1. URL parameters (highest priority, always override)
2. Persisted sessionStorage values
3. Meta tags (lowest priority)

### Attribution URL Parameters Best Practices

1. **Use Consistent Naming**
   ```javascript
   // Good - descriptive and consistent
   ?funnel=summer-sale-2024&affid=partner-network-west
   
   // Avoid - unclear abbreviations
   ?f=ss24&a=pnw
   ```

2. **Combine Parameters Logically**
   ```javascript
   // Track complete campaign attribution
   ?funnel=fb-campaign&affid=social-partner&utm_source=facebook&utm_medium=cpc&utm_campaign=summer-2024
   ```

3. **Document Your Funnels**
   Maintain a list of active funnels and their purposes:
   - `summer-sale-2024` - Summer promotional campaign
   - `vip-exclusive` - VIP member offers
   - `affiliate-special` - Affiliate partner promotions

4. **Test Attribution Capture**
   ```javascript
   // In console, verify attribution was captured
   next.debugAttribution();
   
   // Check specific fields
   const attribution = next.getAttribution();
   console.log('Funnel:', attribution.funnel);
   console.log('Affiliate:', attribution.affiliate);
   ```

5. **Monitor Attribution Data**
   Use your backend analytics to:
   - Track conversion by funnel
   - Calculate affiliate ROI
   - Optimize campaign performance
   - Identify top-performing sources

### Important Notes

**Character Limits:**
- **Subaffiliate values**: Limited to 225 characters each
- Values exceeding this limit are automatically truncated with a warning

**Persistence:**
- Attribution data persists in **sessionStorage** (cleared when browser closes)
- Some values (funnel, evclid) also persist in **localStorage** (survives browser restart)

**Security:**
- Attribution parameters are visible in URLs
- Do not use attribution parameters for sensitive data
- Validate all attribution data server-side

**API Integration:**
- Attribution data is automatically included in all order-related API calls
- No manual intervention required
- Data appears in order records for reporting

## Session Persistence

Attribution data persists throughout the user's session:

- **Session Storage**: Primary attribution data
- **Local Storage**: Funnel names and Everflow IDs
- **Duration**: Cleared when browser session ends

## Best Practices

1. **Initialize Early**: Set attribution data as soon as possible in the user journey
2. **Avoid PII**: Never include personally identifiable information (emails, names, etc.)
3. **Use Consistent Keys**: Establish naming conventions for metadata fields
4. **Validate Data**: Ensure metadata values are valid JSON types
5. **Document Fields**: Maintain documentation of custom metadata fields
6. **Test Integration**: Verify attribution data appears correctly in orders

## Debugging

```javascript
// Check current attribution state
window.NextAttributionStore.debug();

// Monitor attribution changes
const store = window.NextStores.useAttributionStore.getState();
const unsubscribe = window.NextStores.useAttributionStore.subscribe(
  (state) => console.log('Attribution updated:', state)
);

// View attribution that will be sent with order
console.log('API Attribution:', window.NextAttributionStore.getAttributionForApi());
```

## Common Issues

### Issue: Metadata not appearing in orders
**Solution**: The most common cause is that the [attribution metadata fields](/docs/campaigns/javascript-api/attribution-metadata) have not been configured in your store's Settings → Metadata. Fields that don't exist as metadata definitions are silently dropped. If the fields are configured, ensure you're calling `updateAttribution()` before order creation and that the metadata object contains valid JSON values.

### Issue: Funnel name not updating
**Solution**: Funnel names are write-once. Use `clearPersistedFunnel()` to reset if needed during development.

### Issue: Attribution data lost on page refresh
**Solution**: Attribution persists in session storage. If you need longer persistence, implement your own storage solution and restore on page load.

## See Also

- [Attribution Metadata Fields](/docs/campaigns/javascript-api/attribution-metadata) - Store-level metadata field configuration
- [URL Parameters API](/docs/campaigns/javascript-api/url-parameters) - General URL parameter management
- [Data Attributes - URL Parameters](/docs/campaigns/data-attributes/url-parameters) - Using parameters with HTML attributes