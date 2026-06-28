# Addresses

Handles saved shipping addresses for authenticated users. Users can save up to 5 addresses and select one at checkout instead of entering address details manually every time.

---

## Endpoints

| Method | Path                     | Auth         | Description               |
| ------ | ------------------------ | ------------ | ------------------------- |
| GET    | `/addresses`             | 🔒 Protected | Get all saved addresses   |
| POST   | `/addresses`             | 🔒 Protected | Add a new address         |
| PUT    | `/addresses/:id`         | 🔒 Protected | Update an address         |
| DELETE | `/addresses/:id`         | 🔒 Protected | Delete an address         |
| PATCH  | `/addresses/:id/default` | 🔒 Protected | Set an address as default |

---

## Address Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "user": "64f1a2b3c4d5e6f7a8b9c0d2",
  "fullName": "Timmy Israel",
  "phone": "08012345678",
  "address": "12 Lagos Street",
  "city": "Ikeja",
  "state": "Lagos",
  "country": "Nigeria",
  "isDefault": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## GET `/addresses`

Fetch all saved addresses for the authenticated user. Default address is always returned first.

**Auth:** 🔒 Protected

### Response `200`

```json
{
  "message": "Addresses fetched successfully",
  "data": []
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 401    | Not authorized, no token     |
| 500    | An unexpected error occurred |

---

## POST `/addresses`

Add a new address. The first address added is automatically set as default. Maximum 5 addresses per user.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "fullName": "Timmy Israel",
  "phone": "08012345678",
  "address": "12 Lagos Street",
  "city": "Ikeja",
  "state": "Lagos",
  "country": "Nigeria"
}
```

| Field      | Type   | Required | Description             |
| ---------- | ------ | -------- | ----------------------- |
| `fullName` | string | Yes      | Full name of recipient  |
| `phone`    | string | Yes      | Phone number            |
| `address`  | string | Yes      | Street address          |
| `city`     | string | Yes      | City                    |
| `state`    | string | Yes      | State                   |
| `country`  | string | No       | Defaults to `"Nigeria"` |

### Response `201`

```json
{
  "message": "Address added successfully",
  "address": {}
}
```

### Errors

| Status | Message                                                                |
| ------ | ---------------------------------------------------------------------- |
| 400    | Invalid request data                                                   |
| 400    | Maximum 5 addresses allowed. Please delete one before adding a new one |
| 401    | Not authorized, no token                                               |
| 500    | An unexpected error occurred                                           |

---

## PUT `/addresses/:id`

Update an existing address. All fields are optional — only provided fields are updated.

**Auth:** 🔒 Protected

### Request Body

All fields from `POST /addresses` are accepted but optional.

### Response `200`

```json
{
  "message": "Address updated successfully",
  "address": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid address ID           |
| 400    | Invalid request data         |
| 401    | Not authorized, no token     |
| 404    | Address not found            |
| 500    | An unexpected error occurred |

---

## DELETE `/addresses/:id`

Delete a saved address. If the deleted address was the default, the most recently added remaining address is automatically promoted to default.

**Auth:** 🔒 Protected

### Response `200`

```json
{
  "message": "Address deleted successfully"
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid address ID           |
| 401    | Not authorized, no token     |
| 404    | Address not found            |
| 500    | An unexpected error occurred |

---

## PATCH `/addresses/:id/default`

Set an address as the default. The previously default address is automatically unset.

**Auth:** 🔒 Protected

### Response `200`

```json
{
  "message": "Default address updated successfully",
  "address": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid address ID           |
| 401    | Not authorized, no token     |
| 404    | Address not found            |
| 500    | An unexpected error occurred |

---

## Notes

- A user can have a maximum of **5 saved addresses**
- The default address is always returned first in `GET /addresses`
- At checkout, pass `addressId` instead of a full `shippingAddress` object to use a saved address — see [Orders](./05-orders.md)
- Deleting the default address automatically promotes the next most recent address to default
