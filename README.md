# Timsrael Clothing, Backend API Documentation

## Overview

This is the complete API reference for the Timsrael Clothing backend. The API is built with Node.js, Express, TypeScript, and MongoDB.

All requests and responses use JSON unless otherwise stated. File uploads use `multipart/form-data`.

---

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-production-url.com/api
```

---

## Authentication

This API uses a dual-token authentication system:

- **Access Token**, short-lived (15 minutes), sent in the `Authorization` header as a Bearer token
- **Refresh Token**, long-lived (7 days), stored in an `httpOnly` cookie automatically by the browser

### How it works

1. Call `POST /auth/login`, you receive an `accessToken` in the response body and a `refreshToken` cookie is set automatically
2. Include the access token in every protected request:
   ```
   Authorization: Bearer <accessToken>
   ```
3. When the access token expires (15 minutes), call `POST /auth/refresh`, you receive a new access token. The refresh token cookie is sent automatically by the browser
4. On logout, call `POST /auth/logout`, the refresh token is invalidated server-side and the cookie is cleared

### Token expiry handling

The frontend should:

- Store the access token in memory (not localStorage, XSS risk)
- Intercept 401 responses and automatically call `POST /auth/refresh` to get a new access token
- Retry the original request with the new access token
- If refresh fails, redirect the user to login

---

## Request Format

### JSON requests

```
Content-Type: application/json
```

### File upload requests

```
Content-Type: multipart/form-data
```

---

## Response Format

All responses follow this structure:

### Success

```json
{
  "message": "Human readable message",
  "data": {}
}
```

### Error

```json
{
  "message": "Human readable error message",
  "errors": {}
}
```

---

## HTTP Status Codes

| Code | Meaning                                                  |
| ---- | -------------------------------------------------------- |
| 200  | Success                                                  |
| 201  | Created                                                  |
| 400  | Bad request, validation error or business rule violation |
| 401  | Unauthorized, missing or invalid access token            |
| 403  | Forbidden, authenticated but not permitted               |
| 404  | Not found                                                |
| 500  | Server error                                             |

---

## Auth Levels

Throughout this documentation, endpoints are marked with one of three auth levels:

| Level        | Meaning                                  |
| ------------ | ---------------------------------------- |
| 🔓 Public    | No token required                        |
| 🔒 Protected | Valid access token required              |
| 🔑 Admin     | Valid access token + admin role required |

---

## Checkout Flow

The full checkout flow involves several endpoints in sequence:

1. **Add items to cart**, `POST /cart`
2. **Calculate shipping fee**, `POST /shipping/calculate` (pass state + order total)
3. **Validate coupon (optional)**, `POST /coupons/validate`
4. **Create order**, `POST /orders` (pass shipping address or saved addressId, optional couponCode, optional measurements)
5. **Initialize payment**, `POST /payments/initialize` (pass orderId)
6. **Redirect customer** to Paystack authorization URL
7. **Paystack webhook** fires automatically on payment success, order status updated to `paid`

---

## Made-to-Measure Flow

For products where `requiresMeasurements: true`:

1. Frontend detects `requiresMeasurements: true` on the product
2. Customer fills in measurement form before checkout
3. Measurements are passed per cart item at `POST /orders` keyed by `variantId`
4. Backend validates measurements are present for all made-to-measure items

For products where `allowCustomMeasurements: true`:

1. Frontend detects `allowCustomMeasurements: true` on the product
2. Customer can optionally fill in measurements OR pick a standard size
3. If measurements are provided, they are stored on the order item
4. If not provided, the standard variant size is used

All measurements are in **inches**.

---

## Pagination

Paginated endpoints accept these query parameters:

| Parameter | Type   | Default | Description    |
| --------- | ------ | ------- | -------------- |
| `page`    | number | 1       | Page number    |
| `limit`   | number | 10      | Items per page |

Paginated responses include:

```json
{
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10
  }
}
```

---

## Environment

The frontend needs these environment variables:

```
VITE_API_URL=http://localhost:5000/api
```

---

## Notes for the Frontend Developer

- The refresh token is in an `httpOnly` cookie, you cannot access it from JavaScript. The browser sends it automatically on requests to the same domain
- Guest cart items are merged with the user cart on login, pass `guestCart` in the login request body
- Product prices are stored per cart item at time of adding to cart, the checkout total reflects the price at add time, not the current product price
- Shipping fee is calculated separately before checkout and added to the order total server-side
- Coupon validation (`POST /coupons/validate`) is a preview, it does not apply the coupon. Pass `couponCode` in `POST /orders` to actually apply it
- Order `totalAmount` = cart subtotal + shipping fee - discount amount
