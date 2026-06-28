# Returns & Refunds

Handles return requests for delivered orders. Customers can request returns on individual items within 7 days of delivery. Refunds are processed automatically via Paystack when the admin approves the return.

---

## Endpoints

| Method | Path                  | Auth         | Description                       |
| ------ | --------------------- | ------------ | --------------------------------- |
| POST   | `/returns`            | 🔒 Protected | Submit a return request           |
| GET    | `/returns/my`         | 🔒 Protected | Get own return requests           |
| GET    | `/returns`            | 🔑 Admin     | Get all return requests           |
| PATCH  | `/returns/:id/review` | 🔑 Admin     | Approve, reject, or mark refunded |

---

## Return Request Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "order": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "totalAmount": 46500,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
    "name": "Timmy Israel",
    "email": "timmy@example.com"
  },
  "items": [
    {
      "product": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d4",
        "name": "Floral Wrap Dress",
        "images": []
      },
      "variantId": "64f1a2b3c4d5e6f7a8b9c0d5",
      "quantity": 1,
      "price": 45000
    }
  ],
  "reason": "The dress arrived in the wrong color.",
  "status": "requested",
  "adminNote": null,
  "refundAmount": 45000,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Return Statuses

| Status      | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `requested` | Customer has submitted a return request                                      |
| `approved`  | Admin approved — Paystack refund triggered automatically                     |
| `rejected`  | Admin rejected the return request                                            |
| `refunded`  | Manual fallback — admin confirmed refund was processed on Paystack dashboard |

### Status Flow

```
requested → approved (Paystack refund triggered automatically)
requested → rejected
approved  → refunded (manual fallback if Paystack refund was processed manually)
```

---

## POST `/returns`

Submit a return request for one or more items from a delivered order. Only orders with status `delivered` can be returned. The return window is **7 days** from delivery.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "orderId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "items": [
    {
      "product": "64f1a2b3c4d5e6f7a8b9c0d4",
      "variantId": "64f1a2b3c4d5e6f7a8b9c0d5",
      "quantity": 1
    }
  ],
  "reason": "The dress arrived in the wrong color."
}
```

| Field               | Type   | Required | Validation                                             |
| ------------------- | ------ | -------- | ------------------------------------------------------ |
| `orderId`           | string | Yes      | Valid MongoDB ObjectId                                 |
| `items`             | array  | Yes      | At least one item required                             |
| `items[].product`   | string | Yes      | Valid MongoDB ObjectId of the product                  |
| `items[].variantId` | string | Yes      | Variant ID from the original order                     |
| `items[].quantity`  | number | Yes      | Integer min 1, cannot exceed original ordered quantity |
| `reason`            | string | Yes      | Min 10, max 1000 characters                            |

### Response `201`

```json
{
  "message": "Return request submitted successfully",
  "returnRequest": {}
}
```

### Errors

| Status | Message                                          |
| ------ | ------------------------------------------------ |
| 400    | Invalid request data                             |
| 400    | Only delivered orders can be returned            |
| 400    | Return window of 7 days has passed               |
| 400    | A return request already exists for this order   |
| 400    | Return item does not match any item in the order |
| 400    | Return quantity cannot exceed ordered quantity   |
| 401    | Not authorized, no token                         |
| 404    | Order not found                                  |
| 500    | An unexpected error occurred                     |

---

## GET `/returns/my`

Fetch the authenticated user's return requests, newest first.

**Auth:** 🔒 Protected

### Query Parameters

| Parameter | Type   | Default | Description               |
| --------- | ------ | ------- | ------------------------- |
| `page`    | number | `1`     | Page number               |
| `limit`   | number | `10`    | Results per page (max 50) |

### Response `200`

```json
{
  "message": "Return requests fetched successfully",
  "data": [],
  "pagination": {
    "total": 3,
    "page": 1,
    "pages": 1
  }
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 401    | Not authorized, no token     |
| 500    | An unexpected error occurred |

---

## GET `/returns`

Fetch all return requests. Admin only. Optionally filter by status.

**Auth:** 🔑 Admin

### Query Parameters

| Parameter | Type   | Default | Description                                                       |
| --------- | ------ | ------- | ----------------------------------------------------------------- |
| `page`    | number | `1`     | Page number                                                       |
| `limit`   | number | `10`    | Results per page (max 50)                                         |
| `status`  | string | —       | Filter by status: `requested`, `approved`, `rejected`, `refunded` |

### Response `200`

```json
{
  "message": "Return requests fetched successfully",
  "data": [],
  "pagination": {
    "total": 10,
    "page": 1,
    "pages": 1
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

## PATCH `/returns/:id/review`

Review a return request. Approving triggers an automatic Paystack refund and restores stock. Rejecting closes the request. `refunded` is a manual fallback for cases where the refund was processed directly on the Paystack dashboard.

**Auth:** 🔑 Admin

### Request Body

```json
{
  "status": "approved",
  "adminNote": "Return approved. Refund will be processed within 3-5 business days."
}
```

| Field       | Type   | Required | Description                                               |
| ----------- | ------ | -------- | --------------------------------------------------------- |
| `status`    | string | Yes      | `"approved"`, `"rejected"`, or `"refunded"`               |
| `adminNote` | string | No       | Optional note visible to the customer. Max 500 characters |

### Response `200`

```json
{
  "message": "Return approved and refund initiated successfully",
  "returnRequest": {}
}
```

> Message varies based on action:
>
> - Approved: `"Return approved and refund initiated successfully"`
> - Rejected: `"Return request updated successfully"`
> - Refunded: `"Return request updated successfully"`

### Errors

| Status | Message                                                                         |
| ------ | ------------------------------------------------------------------------------- |
| 400    | Invalid return request ID                                                       |
| 400    | Invalid request data                                                            |
| 400    | Cannot update return request with status "[current status]"                     |
| 400    | Only approved return requests can be marked as refunded                         |
| 400    | Order has no payment reference — refund must be processed manually              |
| 401    | Not authorized, no token                                                        |
| 403    | Admin access required                                                           |
| 404    | Return request not found                                                        |
| 404    | Order not found                                                                 |
| 500    | Stock restored but refund failed. Please process manually on Paystack dashboard |
| 500    | An unexpected error occurred                                                    |

---

## Notes

- Only one return request is allowed per order — partial returns across multiple requests are not supported
- `refundAmount` is calculated from the item prices at time of purchase — not the current product price
- Stock is restored immediately when the return is approved — before the refund is processed
- If the Paystack refund fails, stock is already restored but the refund error is returned. The admin should process the refund manually on the Paystack dashboard and then set the status to `refunded`
- The 7-day return window is calculated from `order.updatedAt` — the last time the order status changed, which should correspond to when it was marked `delivered`
