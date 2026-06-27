# Authentication

Handles user registration, login, logout, token refresh, and password reset.

---

## Endpoints

| Method | Path                    | Auth         | Description                         |
| ------ | ----------------------- | ------------ | ----------------------------------- |
| POST   | `/auth/register`        | 🔓 Public    | Register a new user                 |
| POST   | `/auth/login`           | 🔓 Public    | Login and receive tokens            |
| POST   | `/auth/logout`          | 🔒 Protected | Logout and invalidate refresh token |
| POST   | `/auth/refresh`         | 🔓 Public    | Get a new access token              |
| POST   | `/auth/forgot-password` | 🔓 Public    | Request a password reset email      |
| POST   | `/auth/reset-password`  | 🔓 Public    | Reset password using token          |

---

## POST `/auth/register`

Register a new user account.

**Auth:** 🔓 Public

**Rate limited:** 10 requests per 15 minutes per IP

### Request Body

```json
{
  "name": "Timmy Israel",
  "email": "timmy@example.com",
  "password": "securepassword"
}
```

| Field      | Type   | Required | Validation                |
| ---------- | ------ | -------- | ------------------------- |
| `name`     | string | Yes      | Min 1, max 100 characters |
| `email`    | string | Yes      | Valid email format        |
| `password` | string | Yes      | Min 8, max 100 characters |

### Response `201`

```json
{
  "id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "name": "Timmy Israel",
  "email": "timmy@example.com"
}
```

### Errors

| Status | Message              |
| ------ | -------------------- |
| 400    | Invalid request data |
| 400    | User already exists  |
| 500    | Server error         |

---

## POST `/auth/login`

Login with email and password. Optionally merge a guest cart on login.

**Auth:** 🔓 Public

**Rate limited:** 10 requests per 15 minutes per IP

### Request Body

```json
{
  "email": "timmy@example.com",
  "password": "securepassword",
  "guestCart": {
    "items": [
      {
        "product": "64f1a2b3c4d5e6f7a8b9c0d1",
        "variantId": "64f1a2b3c4d5e6f7a8b9c0d2",
        "quantity": 2,
        "price": 15000
      }
    ]
  }
}
```

| Field       | Type   | Required | Description                                 |
| ----------- | ------ | -------- | ------------------------------------------- |
| `email`     | string | Yes      | User email                                  |
| `password`  | string | Yes      | User password                               |
| `guestCart` | object | No       | Guest cart to merge with user cart on login |

### Response `200`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Timmy Israel",
    "email": "timmy@example.com",
    "isAdmin": false
  },
  "cart": null
}
```

A `refreshToken` cookie is set automatically. `cart` is `null` if no guest cart was provided.

### Errors

| Status | Message              |
| ------ | -------------------- |
| 400    | Invalid request data |
| 400    | Invalid credentials  |
| 500    | Server error         |

---

## POST `/auth/logout`

Logout and invalidate the refresh token.

**Auth:** 🔒 Protected

### Request Body

None — the refresh token cookie is sent automatically by the browser.

### Response `200`

```json
{
  "message": "Logged out successfully"
}
```

### Errors

| Status | Message      |
| ------ | ------------ |
| 500    | Server error |

---

## POST `/auth/refresh`

Get a new access token using the refresh token cookie.

**Auth:** 🔓 Public (refresh token cookie required)

### Request Body

None — the refresh token cookie is sent automatically by the browser.

### Response `200`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Errors

| Status | Message                          |
| ------ | -------------------------------- |
| 401    | No refresh token                 |
| 403    | Invalid refresh token            |
| 403    | Invalid or expired refresh token |

---

## POST `/auth/forgot-password`

Request a password reset email. Always returns the same response regardless of whether the email exists — this prevents email enumeration.

**Auth:** 🔓 Public

**Rate limited:** 10 requests per 15 minutes per IP

### Request Body

```json
{
  "email": "timmy@example.com"
}
```

### Response `200`

```json
{
  "message": "If that email is registered, you'll receive a reset link shortly."
}
```

---

## POST `/auth/reset-password`

Reset password using the token from the reset email.

**Auth:** 🔓 Public

### Request Body

```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "newsecurepassword"
}
```

| Field         | Type   | Required | Description                              |
| ------------- | ------ | -------- | ---------------------------------------- |
| `token`       | string | Yes      | Token from the password reset email link |
| `newPassword` | string | Yes      | New password to set                      |

### Response `200`

```json
{
  "message": "Password reset successful"
}
```

### Errors

| Status | Message                  |
| ------ | ------------------------ |
| 400    | Invalid or expired token |
| 500    | Server error             |
