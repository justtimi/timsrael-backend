# Inventory

Handles stock adjustments and inventory log viewing. All endpoints are admin only. Inventory changes are automatically logged when orders are placed or cancelled — admins can also make manual adjustments.

---

## Endpoints

| Method | Path                             | Auth     | Description                         |
| ------ | -------------------------------- | -------- | ----------------------------------- |
| GET    | `/products/:id/inventory/logs`   | 🔑 Admin | Get inventory logs for a product    |
| PATCH  | `/products/:id/inventory/adjust` | 🔑 Admin | Manually adjust stock for a variant |

---

## Inventory Log Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "product": "64f1a2b3c4d5e6f7a8b9c0d2",
  "variantId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "quantityChange": -2,
  "reason": "purchase",
  "performedBy": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d4",
    "name": "Timmy Israel",
    "email": "timmy@example.com"
  },
  "note": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

> `quantityChange` is a signed integer — negative for stock deductions, positive for restorations or additions.

---

## Log Reasons

| Reason              | Trigger                                                             |
| ------------------- | ------------------------------------------------------------------- |
| `purchase`          | Customer placed an order — stock deducted automatically             |
| `cancellation`      | Customer or admin cancelled an order — stock restored automatically |
| `manual_adjustment` | Admin manually adjusted stock via the adjust endpoint               |

---

## GET `/products/:id/inventory/logs`

Fetch inventory logs for a specific product, newest first.

**Auth:** 🔑 Admin

### URL Parameters

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| `id`      | string | MongoDB ObjectId of the product |

### Query Parameters

| Parameter | Type   | Default | Description                |
| --------- | ------ | ------- | -------------------------- |
| `page`    | number | `1`     | Page number                |
| `limit`   | number | `20`    | Results per page (max 100) |

### Response `200`

```json
{
  "message": "Inventory logs fetched successfully",
  "data": [],
  "pagination": {
    "total": 48,
    "page": 1,
    "pages": 3
  }
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid product ID           |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 500    | An unexpected error occurred |

---

## PATCH `/products/:id/inventory/adjust`

Manually adjust the stock of a specific variant. Use positive values to add stock, negative values to remove stock. Cannot adjust stock below zero.

**Auth:** 🔑 Admin

### URL Parameters

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| `id`      | string | MongoDB ObjectId of the product |

### Request Body

```json
{
  "variantId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "quantityChange": 10,
  "note": "Restocked from supplier delivery"
}
```

| Field            | Type   | Required | Validation                                            |
| ---------------- | ------ | -------- | ----------------------------------------------------- |
| `variantId`      | string | Yes      | Valid MongoDB ObjectId of the variant                 |
| `quantityChange` | number | Yes      | Non-zero integer. Positive to add, negative to remove |
| `note`           | string | No       | Reason for adjustment. Min 1, max 500 characters      |

### Response `200`

```json
{
  "message": "Stock adjusted successfully",
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "variantId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "quantityChange": 10,
  "newStock": 25
}
```

### Errors

| Status | Message                                                       |
| ------ | ------------------------------------------------------------- |
| 400    | Invalid product ID                                            |
| 400    | Invalid request data                                          |
| 400    | Quantity change cannot be zero                                |
| 400    | Adjustment would result in negative stock. Current stock is X |
| 401    | Not authorized, no token                                      |
| 403    | Admin access required                                         |
| 404    | Product not found                                             |
| 404    | Variant not found                                             |
| 500    | An unexpected error occurred                                  |

---

## Notes

- All stock changes across the system are automatically logged — purchases, cancellations, and manual adjustments
- `performedBy` shows the user who triggered the change — for purchases and cancellations this is the customer, for manual adjustments this is the admin
- The adjust endpoint prevents stock from going below zero — if the adjustment would result in negative stock, a `400` error is returned with the current stock level
- Always include a `note` for manual adjustments — it helps track why stock was changed (e.g. "Restocked from supplier", "Damaged items removed", "Inventory count correction")
