# Payments

Handles Paystack payment initialization and webhook verification. Payments are initiated after an order is created.

---

## Endpoints

| Method | Path                   | Auth         | Description                   |
| ------ | ---------------------- | ------------ | ----------------------------- |
| POST   | `/payments/initialize` | 🔒 Protected | Initialize a Paystack payment |
| POST   | `/payments/webhook`    | 🔓 Public    | Paystack webhook handler      |

---

## Payment Flow

1. Customer creates an order via `POST /orders` — order status is `pending`
2. Frontend calls `POST /payments/initialize` with the `orderId`
3. Backend calls Paystack API and returns an `authorizationUrl` and `accessCode`
4. Frontend either:
   - Redirects the customer to `authorizationUrl` (full page redirect), or
   - Uses the `accessCode` with Paystack's inline popup (payment on your site)
5. After payment, Paystack redirects the customer to `CLIENT_URL/payment/verify`
6. Paystack also sends a webhook to `POST /payments/webhook` — this is how the order is marked `paid`

> **Important:** Never rely on the frontend redirect to confirm payment. Always wait for the webhook. The webhook is the source of truth.

---

## POST `/payments/initialize`

Initialize a Paystack payment for a pending order.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "orderId": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

| Field     | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| `orderId` | string | Yes      | ObjectId of the order to pay for |

### Response `200`

```json
{
  "authorizationUrl": "https://checkout.paystack.com/abc123",
  "accessCode": "abc123",
  "reference": "order_64f1a2b3c4d5e6f7a8b9c0d1_1704067200000"
}
```

| Field              | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `authorizationUrl` | Redirect the customer here for full-page Paystack checkout        |
| `accessCode`       | Use with Paystack inline popup for on-site checkout               |
| `reference`        | Unique transaction reference — store this if needed for debugging |

### Errors

| Status | Message                       |
| ------ | ----------------------------- |
| 400    | Order ID is required          |
| 400    | Invalid order ID              |
| 401    | Not authorized, no token      |
| 404    | Order not found               |
| 400    | Order has already been paid   |
| 500    | Payment initialization failed |
| 500    | An unexpected error occurred  |

---

## POST `/payments/webhook`

Receives and verifies Paystack webhook events. On a successful `charge.success` event, the order status is updated to `paid` and the Paystack transaction reference is stored on the order.

**Auth:** 🔓 Public (verified via HMAC SHA-512 signature)

> **Do not call this endpoint from the frontend.** It is called automatically by Paystack after a successful payment. The request must include the raw body and the `x-paystack-signature` header — both are handled automatically by Paystack.

### Paystack Dashboard Setup

In your Paystack dashboard, set the webhook URL to:

```
https://your-production-url.com/api/payments/webhook
```

### Events Handled

| Event            | Action                                                      |
| ---------------- | ----------------------------------------------------------- |
| `charge.success` | Order marked as `paid`, `paystackReference` stored on order |

All other events return `200` without any action.

### Response `200`

```json
{
  "received": true
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Missing signature            |
| 401    | Invalid signature            |
| 400    | Missing order ID in webhook  |
| 404    | Order not found              |
| 500    | An unexpected error occurred |
