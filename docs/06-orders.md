# Orders

Handles order creation, retrieval, cancellation, status management, and tracking. The checkout flow involves several steps — see the [Checkout Flow](../README.md#checkout-flow) in the README for the full sequence.

---

## Endpoints

| Method | Path                   | Auth         | Description            |
| ------ | ---------------------- | ------------ | ---------------------- |
| POST   | `/orders`              | 🔒 Protected | Create an order        |
| GET    | `/orders/my`           | 🔒 Protected | Get own orders         |
| GET    | `/orders/my/:id`       | 🔒 Protected | Get a single own order |
| DELETE | `/orders/my/:id`       | 🔒 Protected | Cancel an order        |
| GET    | `/orders`              | 🔑 Admin     | Get all orders         |
| PATCH  | `/orders/:id/status`   | 🔑 Admin     | Update order status    |
| POST   | `/orders/:id/tracking` | 🔑 Admin     | Add a tracking event   |

---

## Order Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "user": "64f1a2b3c4d5e6f7a8b9c0d2",
  "items": [
    {
      "product": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
        "name": "Floral Wrap Dress",
        "images": []
      },
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
  ],
  "shippingAddress": {
    "fullName": "Timmy Israel",
    "phone": "08012345678",
    "address": "12 Lagos Street",
    "city": "Ikeja",
    "state": "Lagos",
    "country": "Nigeria"
  },
  "shippingFee": 1500,
  "discountAmount": 0,
  "couponCode": null,
  "totalAmount": 46500,
  "status": "pending",
  "trackingHistory": [
    {
      "status": "processing",
      "note": "Order received and being prepared",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

> `totalAmount` = cart subtotal + `shippingFee` - `discountAmount`

> `measurements` is only present on order items where the product has `requiresMeasurements: true` or `allowCustomMeasurements: true` and the customer provided them. All measurement values are in **inches**.

---

## Order Statuses

| Status      | Description                              |
| ----------- | ---------------------------------------- |
| `pending`   | Order created, payment not yet confirmed |
| `paid`      | Payment confirmed via Paystack webhook   |
| `shipped`   | Order dispatched                         |
| `delivered` | Order received by customer               |
| `cancelled` | Order cancelled by customer or admin     |

### Allowed Status Transitions (Admin)

| From        | Can transition to      |
| ----------- | ---------------------- |
| `pending`   | `paid`, `cancelled`    |
| `paid`      | `shipped`, `cancelled` |
| `shipped`   | `delivered`            |
| `delivered` | — (terminal)           |
| `cancelled` | — (terminal)           |

---

## Tracking Event Statuses

| Status             | Description                  |
| ------------------ | ---------------------------- |
| `processing`       | Order is being prepared      |
| `shipped`          | Order has been dispatched    |
| `out_for_delivery` | Order is with dispatch rider |
| `delivered`        | Order has been delivered     |
| `failed_delivery`  | Delivery attempt failed      |

---

## POST `/orders`

Create a new order from the current cart. Stock is atomically deducted. Cart is cleared on success.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "addressId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "couponCode": "WELCOME10",
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

| Field             | Type   | Required | Description                             |
| ----------------- | ------ | -------- | --------------------------------------- |
| `addressId`       | string | No\*     | ObjectId of a saved address             |
| `shippingAddress` | object | No\*     | Full shipping address object            |
| `couponCode`      | string | No       | Coupon code to apply                    |
| `measurements`    | object | No\*\*   | Measurement values keyed by `variantId` |

> \*Either `addressId` or `shippingAddress` must be provided — not both, not neither.

> \*\*Measurements are required for products where `requiresMeasurements: true`. They are optional for products where `allowCustomMeasurements: true`. They are ignored for all other products.

### Shipping Address Object (if not using addressId)

```json
{
  "shippingAddress": {
    "fullName": "Timmy Israel",
    "phone": "08012345678",
    "address": "12 Lagos Street",
    "city": "Ikeja",
    "state": "Lagos",
    "country": "Nigeria"
  }
}
```

### Response `201`

```json
{
  "message": "Order placed successfully",
  "order": {}
}
```

### Special Response `409` — Cart Price Updated

```json
{
  "message": "Some item prices have changed since you added them to your cart. Your cart has been updated with the latest prices. Please review and confirm your order.",
  "code": "CART_PRICE_UPDATED"
}
```

When this response is received, fetch the updated cart and show the customer the new prices before retrying checkout.

### Errors

| Status | Message                                                                   |
| ------ | ------------------------------------------------------------------------- |
| 400    | Invalid request data                                                      |
| 400    | Cart is empty                                                             |
| 400    | No shipping available for your location                                   |
| 400    | Invalid coupon code                                                       |
| 400    | Coupon has expired                                                        |
| 400    | Coupon usage limit reached                                                |
| 400    | You have already used this coupon                                         |
| 400    | Minimum order value of ₦X required for this coupon                        |
| 400    | Only X units left for [product name]                                      |
| 400    | Stock changed during checkout for [product name]. Please review your cart |
| 400    | Measurements are required for [product name]                              |
| 401    | Not authorized, no token                                                  |
| 404    | Address not found                                                         |
| 404    | Product not found in cart                                                 |
| 404    | Variant not found                                                         |
| 409    | Cart prices updated — see above                                           |
| 500    | An unexpected error occurred                                              |

---

## GET `/orders/my`

Fetch the authenticated user's orders, newest first.

**Auth:** 🔒 Protected

### Query Parameters

| Parameter | Type   | Default | Description               |
| --------- | ------ | ------- | ------------------------- |
| `page`    | number | `1`     | Page number               |
| `limit`   | number | `10`    | Results per page (max 50) |

### Response `200`

```json
{
  "message": "Orders fetched successfully",
  "data": [],
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1
  }
}
```

---

## GET `/orders/my/:id`

Fetch a single order belonging to the authenticated user.

**Auth:** 🔒 Protected

### Response `200`

```json
{
  "message": "Order fetched successfully",
  "order": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid order ID             |
| 401    | Not authorized, no token     |
| 404    | Order not found              |
| 500    | An unexpected error occurred |

---

## DELETE `/orders/my/:id`

Cancel a pending order. Stock is restored. Only `pending` orders can be cancelled by the customer.

**Auth:** 🔒 Protected

### Response `200`

```json
{
  "message": "Order cancelled successfully"
}
```

### Errors

| Status | Message                                                |
| ------ | ------------------------------------------------------ |
| 400    | Invalid order ID                                       |
| 400    | Order cannot be cancelled — current status is [status] |
| 401    | Not authorized, no token                               |
| 404    | Order not found                                        |
| 500    | An unexpected error occurred                           |

---

## GET `/orders`

Fetch all orders. Admin only. Optionally filter by status.

**Auth:** 🔑 Admin

### Query Parameters

| Parameter | Type   | Default | Description               |
| --------- | ------ | ------- | ------------------------- |
| `page`    | number | `1`     | Page number               |
| `limit`   | number | `10`    | Results per page (max 50) |
| `status`  | string | —       | Filter by order status    |

### Response `200`

```json
{
  "message": "Orders fetched successfully",
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10
  }
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid status value         |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 500    | An unexpected error occurred |

---

## PATCH `/orders/:id/status`

Update an order's status. Transitions are enforced — see the status transition table above.

**Auth:** 🔑 Admin

### Request Body

```json
{
  "status": "shipped"
}
```

### Response `200`

```json
{
  "message": "Order status updated successfully",
  "order": {}
}
```

### Errors

| Status | Message                                             |
| ------ | --------------------------------------------------- |
| 400    | Invalid order ID                                    |
| 400    | Invalid status value                                |
| 400    | Cannot transition order from "[current]" to "[new]" |
| 401    | Not authorized, no token                            |
| 403    | Admin access required                               |
| 404    | Order not found                                     |
| 500    | An unexpected error occurred                        |

---

## POST `/orders/:id/tracking`

Add a tracking event to an order. Cancelled orders cannot have tracking events added.

**Auth:** 🔑 Admin

### Request Body

```json
{
  "status": "shipped",
  "note": "Dispatched via GIG Logistics"
}
```

| Field    | Type   | Required | Description                                                 |
| -------- | ------ | -------- | ----------------------------------------------------------- |
| `status` | string | Yes      | One of the tracking event statuses above                    |
| `note`   | string | No       | Optional note about this tracking event. Max 500 characters |

### Response `201`

```json
{
  "message": "Tracking event added successfully",
  "order": {}
}
```

### Errors

| Status | Message                                  |
| ------ | ---------------------------------------- |
| 400    | Invalid order ID                         |
| 400    | Invalid request data                     |
| 400    | Cannot add tracking to a cancelled order |
| 401    | Not authorized, no token                 |
| 403    | Admin access required                    |
| 404    | Order not found                          |
| 500    | An unexpected error occurred             |
