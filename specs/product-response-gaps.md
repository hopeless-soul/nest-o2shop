# GET Product Response — Gap Analysis vs Reference

Reference: `specs/Reference get product payload.txt` (Shopify product API)
Current: `ProductResponseDto` (`GET /products/{name}`)

---

## Product-level gaps

### HIGH priority

| Field | Reference | Current | Notes |
|---|---|---|---|
| `available` | `"available": true` | absent | Boolean derived from "any variant has stock > 0". Safer than exposing raw stock to consumers; needed for Add-to-Cart gating |
| `compareAtPrice` | `"compare_at_price": 76200` | absent | Product-level original price. Required to render sale/discount UI ("was $X, now $Y") |
| `priceMin` / `priceMax` | `"price_min": 76200, "price_max": 76200` | only `basePrice` | When variants have `priceOverride`, a single `basePrice` is misleading. Frontend needs min/max to show "From $X" |
| `priceVaries` | `"price_varies": false` | absent | Tells UI whether to show a range or a fixed price without computing it client-side |
| `options` | `[{ "name": "Size", "position": 1, "values": ["XS","S","M","L","XL","2XL","3XL"] }]` | absent | Option-group definitions are essential for rendering size/color selectors. Currently the client must infer groups by iterating all variants |

### MEDIUM priority

| Field | Reference | Current | Notes |
|---|---|---|---|
| `tags` | `["black","gambling","standalone",...]` | absent | Used for frontend filter chips, SEO meta, and related-product logic |
| `publishedAt` / `createdAt` | `"published_at"`, `"created_at"` | absent from public DTO | Needed for "New arrival" badges and client-side sort-by-date. The entity has these columns; they're just not mapped |

### LOW priority

| Field | Reference | Current | Notes |
|---|---|---|---|
| `vendor` | `"vendor": "Very Cool"` | absent | Brand name. Relevant for multi-brand stores; could be derived from a `brand` field or left to `collection` |
| `type` | `"type": "T-Shirt"` | absent | Product type label; partially redundant with `subCategory.displayName` in our design |

---

## Variant-level gaps

| Field | Reference | Current | Notes |
|---|---|---|---|
| `available` | `"available": true` | absent (only `stock: number`) | Per-variant availability boolean. Consumers should not need to check `stock > 0` themselves; also avoids leaking exact inventory |
| `compareAtPrice` | `"compare_at_price": 76200` | absent | Per-variant original price; some variants may be on sale while others are not |
| `title` / display name | `"name": "The Gambling Tee - XS"` | absent | Full composed label. Client can build it from `product.displayName + variant.size`, but an explicit field is more convenient |
| `weight` | `"weight": 450` | absent | Needed for shipping cost estimation at cart/checkout |
| `inventoryPolicy` | `"inventory_policy": "deny"` | absent | Whether to allow adding to cart when stock = 0 ("deny" blocks it, "continue" allows backorders) |
| `quantityRule` | `{ "min": 1, "max": null, "increment": 1 }` | absent | Useful for B2B / multi-quantity ordering |
| `barcode` | `"barcode": ""` | absent | EAN/UPC; low priority for basic storefront |

---

## Photo/media gaps

| Field | Reference | Current | Notes |
|---|---|---|---|
| `width` / `height` / `aspectRatio` | `"width": 1200, "height": 1500, "aspect_ratio": 0.8` | absent | Prevents Cumulative Layout Shift (CLS) — browser can reserve correct space before image loads. Important for Core Web Vitals |
| `position` | `"position": 1` | `sortOrder` covers this | No gap, different name |
| `mediaType` | `"media_type": "image"` | absent | Useful if video support is added later; low priority now |

---

## Description format — intentional difference

Reference uses a **raw HTML string**:
```json
"description": "<p>BET IT ALL ON BLACK!</p><ul><li>Screen Print...</li></ul>"
```

Current uses **structured blocks**:
```json
"description": { "blocks": [{ "type": "text", "content": "..." }, { "type": "points", "items": [...] }] }
```

The current design is intentionally better — no XSS risk, renderer-agnostic, structured for i18n. Keep it.

---

## Summary of recommended additions

**`ProductResponseDto`**
- `available: boolean`
- `compareAtPrice: number | null`
- `priceMin: number`
- `priceMax: number`
- `priceVaries: boolean`
- `tags: string[]`
- `publishedAt: string (ISO 8601)`
- `options: { name: string; position: number; values: string[] }[]`

**`ProductVariantResponseDto`**
- `available: boolean`
- `compareAtPrice: number | null`

**`ProductPhotoResponseDto` / `ProductPhotoSummaryDto`**
- `width: number | null`
- `height: number | null`
- `aspectRatio: number | null`
