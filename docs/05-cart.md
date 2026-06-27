# Cart

Handles the authenticated user's shopping cart. All endpoints require authentication.

---

## Endpoints

| Method | Path                          | Auth         | Description            |
| ------ | ----------------------------- | ------------ | ---------------------- |
| POST   | `/cart`                       | 🔒 Protected | Add item to cart       |
| GET    | `/cart`                       | 🔒 Protected | Get current cart       |
| PUT    | `/cart`                       | 🔒 Protected | Update item quantity   |
| DELETE | `/cart/clear`                 | 🔒 Protected | Clear entire cart      |
| DELETE | `/cart/:productId/:variantId` | 🔒 Protected | Remove a specific item |

---

## Cart Object

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
      "quantity": 2,
      "price": 38000
    }
  ],
  "totalPrice": 76000,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

> `price` per item is locked at the time it is added to the cart. If the product price changes afterward, the cart price will not update until checkout — at which point a `409` is returned and the cart is refreshed. See [Orders](./06-orders.md) for details.

> `totalPrice` is a computed virtual — it is never stored in the database.

---

## POST `/cart`

Add an item to the cart. If the item already exists (same product and variant), the quantity is incremented.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "productId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "variantId": "64f1a2b3c4d5e6f7a8b9c0d4",
  "quantity": 1
}
```

| Field       | Type   | Required | Validation             |
| ----------- | ------ | -------- | ---------------------- |
| `productId` | string | Yes      | Valid MongoDB ObjectId |
| `variantId` | string | Yes      | Valid MongoDB ObjectId |
| `quantity`  | number | Yes      | Positive integer       |

### Response `200`

```json
{
  "message": "Added to cart successfully",
  "cart": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid request data         |
| 400    | Insufficient stock           |
| 401    | Not authorized, no token     |
| 404    | Product not found            |
| 404    | Variant not found            |
| 500    | An unexpected error occurred |

---

## GET `/cart`

Fetch the current user's cart with product details populated.

**Auth:** 🔒 Protected

### Response `200`

```json
{
  "message": "Cart fetched successfully",
  "cart": {}
}
```

> If the user has no cart, returns an empty cart instead of a 404:

```json
{
  "message": "Cart is empty",
  "cart": { "items": [], "totalPrice": 0 }
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 401    | Not authorized, no token     |
| 500    | An unexpected error occurred |

---

## PUT `/cart`

Update the quantity of an item in the cart. Sending `quantity: 0` removes the item.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "productId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "variantId": "64f1a2b3c4d5e6f7a8b9c0d4",
  "quantity": 3
}
```

| Field       | Type   | Required | Validation             |
| ----------- | ------ | -------- | ---------------------- |
| `productId` | string | Yes      | Valid MongoDB ObjectId |
| `variantId` | string | Yes      | Valid MongoDB ObjectId |
| `quantity`  | number | Yes      | Integer, min 0         |

### Response `200`

```json
{
  "message": "Cart updated successfully",
  "cart": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid request data         |
| 400    | Insufficient stock           |
| 401    | Not authorized, no token     |
| 404    | Cart not found               |
| 404    | Item not in cart             |
| 404    | Product not found            |
| 404    | Variant not found            |
| 500    | An unexpected error occurred |

---

## DELETE `/cart/clear`

Remove all items from the cart.

**Auth:** 🔒 Protected

### Response `200`

```json
{
  "message": "Cart cleared successfully",
  "cart": { "items": [], "totalPrice": 0 }
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 401    | Not authorized, no token     |
| 404    | Cart not found               |
| 500    | An unexpected error occurred |

---

## DELETE `/cart/:productId/:variantId`

Remove a specific item from the cart by product and variant ID.

**Auth:** 🔒 Protected

### URL Parameters

| Parameter   | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| `productId` | string | MongoDB ObjectId of the product |
| `variantId` | string | MongoDB ObjectId of the variant |

### Response `200`

```json
{
  "message": "Item removed successfully",
  "cart": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid request data         |
| 401    | Not authorized, no token     |
| 404    | Cart not found               |
| 404    | Item not in cart             |
| 500    | An unexpected error occurred |
