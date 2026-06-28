# Shipping

Handles shipping zones and fee calculation. The designer manages zones and pricing via admin endpoints. Customers use the public calculate endpoint to preview shipping costs before checkout.

---

## Endpoints

| Method | Path                  | Auth      | Description               |
| ------ | --------------------- | --------- | ------------------------- |
| GET    | `/shipping`           | 🔓 Public | Get all shipping zones    |
| POST   | `/shipping/calculate` | 🔓 Public | Calculate shipping fee    |
| POST   | `/shipping`           | 🔑 Admin  | Create a shipping zone    |
| GET    | `/shipping/:id`       | 🔑 Admin  | Get a shipping zone by ID |
| PUT    | `/shipping/:id`       | 🔑 Admin  | Update a shipping zone    |
| DELETE | `/shipping/:id`       | 🔑 Admin  | Delete a shipping zone    |

---

## Shipping Zone Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "name": "Lagos",
  "states": ["Lagos"],
  "baseFee": 1500,
  "tiers": [
    {
      "minOrderValue": 0,
      "maxOrderValue": 10000,
      "additionalFee": 0
    },
    {
      "minOrderValue": 10001,
      "maxOrderValue": 30000,
      "additionalFee": 500
    },
    {
      "minOrderValue": 30001,
      "additionalFee": 1000
    }
  ],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

> `maxOrderValue` is optional on the last tier — omitting it means "no upper limit".

> All fees are in **NGN**.

---

## How Shipping Fee is Calculated

1. The customer's state is matched to a shipping zone
2. The base fee for that zone is used as the starting fee
3. The order subtotal is checked against the zone's tiers
4. The matching tier's `additionalFee` is added to the base fee
5. Final shipping fee = `baseFee` + `additionalFee`

**Example:**

- Zone: Lagos, `baseFee`: ₦1,500
- Order total: ₦25,000
- Matching tier: `minOrderValue: 10001, maxOrderValue: 30000, additionalFee: 500`
- Final shipping fee: ₦1,500 + ₦500 = **₦2,000**

---

## GET `/shipping`

Fetch all shipping zones.

**Auth:** 🔓 Public

### Response `200`

```json
{
  "message": "Shipping zones fetched successfully",
  "data": []
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 500    | An unexpected error occurred |

---

## POST `/shipping/calculate`

Calculate the shipping fee for a given state and order total. Call this before checkout to show the customer their shipping cost.

**Auth:** 🔓 Public

### Request Body

```json
{
  "state": "Lagos",
  "orderTotal": 25000
}
```

| Field        | Type   | Required | Description          |
| ------------ | ------ | -------- | -------------------- |
| `state`      | string | Yes      | The customer's state |
| `orderTotal` | number | Yes      | Cart subtotal in NGN |

### Response `200`

```json
{
  "message": "Shipping fee calculated successfully",
  "data": {
    "zone": "Lagos",
    "baseFee": 1500,
    "additionalFee": 500,
    "shippingFee": 2000
  }
}
```

### Errors

| Status | Message                                 |
| ------ | --------------------------------------- |
| 400    | State is required                       |
| 400    | Valid order total is required           |
| 404    | No shipping available for this location |
| 500    | An unexpected error occurred            |

---

## POST `/shipping`

Create a new shipping zone. A state can only belong to one zone at a time.

**Auth:** 🔑 Admin

### Request Body

```json
{
  "name": "Lagos",
  "states": ["Lagos"],
  "baseFee": 1500,
  "tiers": [
    {
      "minOrderValue": 0,
      "maxOrderValue": 10000,
      "additionalFee": 0
    },
    {
      "minOrderValue": 10001,
      "additionalFee": 500
    }
  ],
  "isActive": true
}
```

| Field                   | Type     | Required | Description                                  |
| ----------------------- | -------- | -------- | -------------------------------------------- |
| `name`                  | string   | Yes      | Zone name, must be unique                    |
| `states`                | string[] | Yes      | At least one state                           |
| `baseFee`               | number   | Yes      | Base shipping fee in NGN                     |
| `tiers`                 | array    | No       | Value-based surcharge tiers                  |
| `tiers[].minOrderValue` | number   | Yes      | Minimum order value for this tier            |
| `tiers[].maxOrderValue` | number   | No       | Maximum order value. Omit for no upper limit |
| `tiers[].additionalFee` | number   | Yes      | Additional fee for this tier                 |
| `isActive`              | boolean  | No       | Defaults to `true`                           |

### Response `201`

```json
{
  "message": "Shipping zone created successfully",
  "zone": {}
}
```

### Errors

| Status | Message                                                  |
| ------ | -------------------------------------------------------- |
| 400    | Invalid request data                                     |
| 400    | One or more states are already assigned to zone "[name]" |
| 401    | Not authorized, no token                                 |
| 403    | Admin access required                                    |
| 500    | An unexpected error occurred                             |

---

## GET `/shipping/:id`

Fetch a single shipping zone by ID.

**Auth:** 🔑 Admin

### Response `200`

```json
{
  "message": "Shipping zone fetched successfully",
  "zone": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid zone ID              |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Shipping zone not found      |
| 500    | An unexpected error occurred |

---

## PUT `/shipping/:id`

Update a shipping zone. All fields are optional.

**Auth:** 🔑 Admin

### Request Body

All fields from `POST /shipping` are accepted but optional.

### Response `200`

```json
{
  "message": "Shipping zone updated successfully",
  "zone": {}
}
```

### Errors

| Status | Message                                                  |
| ------ | -------------------------------------------------------- |
| 400    | Invalid zone ID                                          |
| 400    | Invalid request data                                     |
| 400    | One or more states are already assigned to zone "[name]" |
| 401    | Not authorized, no token                                 |
| 403    | Admin access required                                    |
| 404    | Shipping zone not found                                  |
| 500    | An unexpected error occurred                             |

---

## DELETE `/shipping/:id`

Permanently delete a shipping zone.

**Auth:** 🔑 Admin

### Response `200`

```json
{
  "message": "Shipping zone deleted successfully"
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid zone ID              |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Shipping zone not found      |
| 500    | An unexpected error occurred |

---

## Notes

- A state can only belong to one shipping zone at a time — adding a state that already exists in another zone will return an error
- Shipping fee is recalculated server-side at checkout — the `POST /shipping/calculate` response is for display purposes only
- If no active zone exists for the customer's state, checkout will be blocked with a `400` error
- Deactivating a zone (`isActive: false`) prevents customers in those states from checking out until a new zone is created for them
