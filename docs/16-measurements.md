# Measurements

Handles made-to-measure sizing for applicable products. Measurements are submitted per order item at checkout and stored permanently on the order.

---

## Overview

Timsrael Clothing offers two sizing approaches:

| Approach              | When to use                                                      | How it works                                                          |
| --------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| Standard sizing       | Ready-to-wear items (accessories, scrunchies, hats, alice bands) | Customer picks a variant (S/M/L) — no measurements needed             |
| Made-to-measure       | Custom garments (blouses, skirts, dresses, gowns)                | Customer provides body measurements at checkout                       |
| Optional measurements | Products where `allowCustomMeasurements: true`                   | Customer can choose between standard sizing OR providing measurements |

---

## How to Detect Measurement Requirements

When fetching a product, check these two fields:

```json
{
  "requiresMeasurements": true,
  "allowCustomMeasurements": false
}
```

| `requiresMeasurements` | `allowCustomMeasurements` | Frontend behaviour                                                              |
| ---------------------- | ------------------------- | ------------------------------------------------------------------------------- |
| `true`                 | any                       | Show measurements form. Block checkout if not filled                            |
| `false`                | `true`                    | Show size chart AND measurements form. Both are optional but one should be used |
| `false`                | `false`                   | Show size chart only. No measurements form needed                               |

---

## Measurement Fields

All measurements are in **inches**.

| Field               | Label             | Description                             |
| ------------------- | ----------------- | --------------------------------------- |
| `bust`              | Bust              | Fullest part of the chest               |
| `waist`             | Waist             | Narrowest part of the torso             |
| `hips`              | Hips              | Fullest part of the hips                |
| `backLength`        | Back Length       | From nape of neck to waist              |
| `halfLength`        | Half Length       | From shoulder to waist                  |
| `sleeveLength`      | Sleeve Length     | From shoulder to wrist                  |
| `roundSleeve`       | Round Sleeve      | Circumference of upper arm              |
| `wrist`             | Wrist             | Circumference of wrist                  |
| `waistToHip`        | Waist to Hip      | From waist down to fullest part of hips |
| `waistToKnee`       | Waist to Knee     | From waist down to knee                 |
| `skirtOrGownLength` | Skirt/Gown Length | From waist down to desired hem          |

---

## How to Submit Measurements at Checkout

Measurements are passed in the `POST /orders` request body, keyed by `variantId`:

```json
{
  "addressId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "measurements": {
    "64f1a2b3c4d5e6f7a8b9c0d4": {
      "bust": 36,
      "waist": 28,
      "hips": 38,
      "backLength": 15,
      "halfLength": 14,
      "sleeveLength": 24,
      "roundSleeve": 14,
      "wrist": 6,
      "waistToHip": 8,
      "waistToKnee": 18,
      "skirtOrGownLength": 40
    }
  }
}
```

The key `"64f1a2b3c4d5e6f7a8b9c0d4"` is the `variantId` of the cart item that requires measurements.

If a cart contains multiple made-to-measure items, provide measurements for each `variantId`:

```json
{
  "measurements": {
    "64f1a2b3c4d5e6f7a8b9c0d4": {
      "bust": 36,
      "waist": 28,
      "hips": 38,
      "backLength": 15,
      "halfLength": 14,
      "sleeveLength": 24,
      "roundSleeve": 14,
      "wrist": 6,
      "waistToHip": 8,
      "waistToKnee": 18,
      "skirtOrGownLength": 40
    },
    "64f1a2b3c4d5e6f7a8b9c0d5": {
      "bust": 36,
      "waist": 28,
      "hips": 38,
      "backLength": 15,
      "halfLength": 14,
      "sleeveLength": 24,
      "roundSleeve": 14,
      "wrist": 6,
      "waistToHip": 8,
      "waistToKnee": 18,
      "skirtOrGownLength": 40
    }
  }
}
```

---

## Size Charts

Products may also include a size chart showing what standard sizes mean in measurements:

```json
{
  "sizeChart": [
    {
      "label": "S",
      "measurements": {
        "bust": 34,
        "waist": 26,
        "hips": 36
      }
    },
    {
      "label": "M",
      "measurements": {
        "bust": 36,
        "waist": 28,
        "hips": 38
      }
    },
    {
      "label": "L",
      "measurements": {
        "bust": 38,
        "waist": 30,
        "hips": 40
      }
    }
  ]
}
```

> Size chart measurements are in the same units as body measurements — **inches**.
> Not all measurement fields need to be present in a size chart entry — only the ones relevant to that garment type are included.

---

## Recommended Checkout UI Flow

### For `requiresMeasurements: true` products

1. On the product detail page, show a measurements form before the customer can add to cart, or show it at checkout
2. Store measurements temporarily in frontend state alongside the cart item
3. At checkout, pass measurements keyed by `variantId` in `POST /orders`
4. If the backend returns `400` with message `"Measurements are required for [product name]"`, highlight the missing measurements form

### For `allowCustomMeasurements: true` products

1. On the product detail page, show both the size chart and an optional measurements form
2. If the customer fills in measurements, pass them at checkout
3. If the customer picks a standard size instead, omit measurements for that `variantId` — the variant size is used

### Displaying measurements on order history

Measurements are stored on each order item and returned with order detail responses. Display them in the order detail page so the customer and designer can both reference them:

```json
{
  "items": [
    {
      "product": {},
      "variantId": "64f1a2b3c4d5e6f7a8b9c0d4",
      "quantity": 1,
      "price": 45000,
      "measurements": {
        "bust": 36,
        "waist": 28,
        "hips": 38,
        "backLength": 15,
        "halfLength": 14,
        "sleeveLength": 24,
        "roundSleeve": 14,
        "wrist": 6,
        "waistToHip": 8,
        "waistToKnee": 18,
        "skirtOrGownLength": 40
      }
    }
  ]
}
```

---

## Notes

- All measurement values are in **inches** — display them as inches in the UI
- Measurements are validated server-side — all 11 fields must be positive numbers when provided
- Measurements are permanently stored on the order item — they never change after checkout
- The designer uses these measurements directly to cut and sew the garment
- If a customer is unsure of their measurements, consider adding a measurement guide or size calculator to the frontend
