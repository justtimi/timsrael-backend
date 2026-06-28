# Coupons

Handles discount coupon creation, validation, and application at checkout. Coupons support percentage discounts, fixed amount discounts, and free shipping.

---

## Endpoints

| Method | Path                | Auth         | Description            |
| ------ | ------------------- | ------------ | ---------------------- |
| POST   | `/coupons/validate` | 🔒 Protected | Validate a coupon code |
| GET    | `/coupons`          | 🔑 Admin     | Get all coupons        |
| POST   | `/coupons`          | 🔑 Admin     | Create a coupon        |
| GET    | `/coupons/:id`      | 🔑 Admin     | Get a coupon by ID     |
| PUT    | `/coupons/:id`      | 🔑 Admin     | Update a coupon        |
| DELETE | `/coupons/:id`      | 🔑 Admin     | Delete a coupon        |

---

## Coupon Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "code": "WELCOME10",
  "type": "percentage",
  "value": 10,
  "minOrderValue": 5000,
  "usageLimit": 100,
  "usageCount": 42,
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

> `usedBy` (array of user IDs) is intentionally excluded from responses — it is only used internally to enforce one use per user.

---

## Coupon Types

| Type            | Description                        | `value` meaning                     |
| --------------- | ---------------------------------- | ----------------------------------- |
| `percentage`    | Percentage off the cart subtotal   | Percentage e.g. `10` = 10% off      |
| `fixed`         | Fixed amount off the cart subtotal | Amount in NGN e.g. `500` = ₦500 off |
| `free_shipping` | Waives the shipping fee entirely   | Ignored — set to `0`                |

---

## How Discount is Applied

| Type            | Formula                                              |
| --------------- | ---------------------------------------------------- |
| `percentage`    | `discountAmount = round(cartSubtotal × value / 100)` |
| `fixed`         | `discountAmount = min(value, cartSubtotal)`          |
| `free_shipping` | `discountAmount = shippingFee`                       |

Final order total = cart subtotal + shipping fee - discount amount

---

## POST `/coupons/validate`

Preview a coupon's discount before checkout. Does not apply the coupon — pass `couponCode` in `POST /orders` to actually apply it.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "couponCode": "WELCOME10",
  "orderTotal": 25000
}
```

| Field        | Type   | Required | Description                 |
| ------------ | ------ | -------- | --------------------------- |
| `couponCode` | string | Yes      | The coupon code to validate |
| `orderTotal` | number | Yes      | Cart subtotal in NGN        |

### Response `200`

```json
{
  "message": "Coupon is valid",
  "data": {
    "code": "WELCOME10",
    "type": "percentage",
    "discountAmount": 2500,
    "freeShipping": false
  }
}
```

> `freeShipping` is `true` only for `free_shipping` type coupons. Use this to show "Free Shipping" messaging in the UI instead of a discount amount.

### Errors

| Status | Message                                            |
| ------ | -------------------------------------------------- |
| 400    | Coupon code is required                            |
| 400    | Valid order total is required                      |
| 400    | Coupon has expired                                 |
| 400    | Coupon usage limit reached                         |
| 400    | You have already used this coupon                  |
| 400    | Minimum order value of ₦X required for this coupon |
| 401    | Not authorized, no token                           |
| 404    | Invalid coupon code                                |
| 500    | An unexpected error occurred                       |

---

## GET `/coupons`

Fetch all coupons, newest first.

**Auth:** 🔑 Admin

### Response `200`

```json
{
  "message": "Coupons fetched successfully",
  "data": []
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 500    | An unexpected error occurred |

---

## POST `/coupons`

Create a new coupon. Coupon codes are automatically uppercased.

**Auth:** 🔑 Admin

### Request Body

```json
{
  "code": "WELCOME10",
  "type": "percentage",
  "value": 10,
  "minOrderValue": 5000,
  "usageLimit": 100,
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "isActive": true
}
```

| Field           | Type    | Required | Validation                                                            |
| --------------- | ------- | -------- | --------------------------------------------------------------------- |
| `code`          | string  | Yes      | Min 1, max 50 characters. Auto-uppercased                             |
| `type`          | string  | Yes      | `"percentage"`, `"fixed"`, or `"free_shipping"`                       |
| `value`         | number  | Yes      | 1–100 for percentage, greater than 0 for fixed, `0` for free_shipping |
| `minOrderValue` | number  | Yes      | Minimum cart subtotal to use coupon. `0` for no minimum               |
| `usageLimit`    | number  | Yes      | Total number of times coupon can be used. Min 1                       |
| `expiresAt`     | string  | Yes      | ISO 8601 datetime e.g. `"2025-12-31T23:59:59.000Z"`                   |
| `isActive`      | boolean | No       | Defaults to `true`                                                    |

### Response `201`

```json
{
  "message": "Coupon created successfully",
  "coupon": {}
}
```

### Errors

| Status | Message                                                               |
| ------ | --------------------------------------------------------------------- |
| 400    | Invalid request data                                                  |
| 400    | Coupon code already exists                                            |
| 400    | Percentage must be between 1-100, fixed amount must be greater than 0 |
| 401    | Not authorized, no token                                              |
| 403    | Admin access required                                                 |
| 500    | An unexpected error occurred                                          |

---

## GET `/coupons/:id`

Fetch a single coupon by ID.

**Auth:** 🔑 Admin

### Response `200`

```json
{
  "message": "Coupon fetched successfully",
  "coupon": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid coupon ID            |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Coupon not found             |
| 500    | An unexpected error occurred |

---

## PUT `/coupons/:id`

Update an existing coupon. All fields are optional.

**Auth:** 🔑 Admin

### Request Body

All fields from `POST /coupons` are accepted but optional.

### Response `200`

```json
{
  "message": "Coupon updated successfully",
  "coupon": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid coupon ID            |
| 400    | Invalid request data         |
| 400    | Coupon code already exists   |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Coupon not found             |
| 500    | An unexpected error occurred |

---

## DELETE `/coupons/:id`

Permanently delete a coupon.

**Auth:** 🔑 Admin

### Response `200`

```json
{
  "message": "Coupon deleted successfully"
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid coupon ID            |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Coupon not found             |
| 500    | An unexpected error occurred |

---

## Notes

- Coupon codes are case-insensitive — `welcome10`, `WELCOME10`, and `Welcome10` all refer to the same coupon
- `POST /coupons/validate` is a preview only — it does not reserve or apply the coupon
- The actual coupon application happens inside the checkout transaction at `POST /orders`
- A customer can only use each coupon once — enforced at both validation and checkout
- `free_shipping` coupons set `discountAmount` equal to the shipping fee — the customer pays ₦0 shipping
- Deactivating a coupon (`isActive: false`) immediately prevents it from being used at checkout
