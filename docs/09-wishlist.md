# Wishlist

Handles the authenticated user's wishlist. Users can save products they are interested in and move them directly to their cart when ready to purchase.

---

## Endpoints

| Method | Path                                | Auth         | Description                  |
| ------ | ----------------------------------- | ------------ | ---------------------------- |
| GET    | `/wishlist`                         | 🔒 Protected | Get wishlist                 |
| POST   | `/wishlist`                         | 🔒 Protected | Add product to wishlist      |
| DELETE | `/wishlist/:productId`              | 🔒 Protected | Remove product from wishlist |
| POST   | `/wishlist/:productId/move-to-cart` | 🔒 Protected | Move product to cart         |

---

## Wishlist Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "user": "64f1a2b3c4d5e6f7a8b9c0d2",
  "products": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
      "name": "Floral Wrap Dress",
      "images": [],
      "price": 45000,
      "discountPrice": 38000,
      "status": "active"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

> The wishlist stores only the product reference — not a specific variant. The customer selects a variant when moving the product to cart.

---

## GET `/wishlist`

Fetch the authenticated user's wishlist with product details populated.

**Auth:** 🔒 Protected

### Response `200`

```json
{
  "message": "Wishlist fetched successfully",
  "wishlist": {}
}
```

> If the user has no wishlist yet, returns an empty wishlist:

```json
{
  "message": "Wishlist is empty",
  "wishlist": { "products": [] }
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 401    | Not authorized, no token     |
| 500    | An unexpected error occurred |

---

## POST `/wishlist`

Add a product to the wishlist. Soft-deleted or non-existent products cannot be added.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "productId": "64f1a2b3c4d5e6f7a8b9c0d3"
}
```

| Field       | Type   | Required | Description                           |
| ----------- | ------ | -------- | ------------------------------------- |
| `productId` | string | Yes      | Valid MongoDB ObjectId of the product |

### Response `200` / `201`

```json
{
  "message": "Product added to wishlist",
  "wishlist": {}
}
```

> Returns `201` if the wishlist was just created, `200` if it already existed.

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid product ID           |
| 400    | Product already in wishlist  |
| 401    | Not authorized, no token     |
| 404    | Product not found            |
| 500    | An unexpected error occurred |

---

## DELETE `/wishlist/:productId`

Remove a product from the wishlist.

**Auth:** 🔒 Protected

### URL Parameters

| Parameter   | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| `productId` | string | MongoDB ObjectId of the product to remove |

### Response `200`

```json
{
  "message": "Product removed from wishlist",
  "wishlist": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid product ID           |
| 401    | Not authorized, no token     |
| 404    | Wishlist not found           |
| 404    | Product not in wishlist      |
| 500    | An unexpected error occurred |

---

## POST `/wishlist/:productId/move-to-cart`

Move a product from the wishlist to the cart. The product is removed from the wishlist and added to the cart with a quantity of 1. Requires a `variantId` since the wishlist stores only the product, not a specific variant.

**Auth:** 🔒 Protected

### URL Parameters

| Parameter   | Type   | Description                             |
| ----------- | ------ | --------------------------------------- |
| `productId` | string | MongoDB ObjectId of the product to move |

### Request Body

```json
{
  "variantId": "64f1a2b3c4d5e6f7a8b9c0d4"
}
```

| Field       | Type   | Required | Description                                     |
| ----------- | ------ | -------- | ----------------------------------------------- |
| `variantId` | string | Yes      | ObjectId of the specific variant to add to cart |

### Response `200`

```json
{
  "message": "Product moved to cart",
  "cart": {},
  "wishlist": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid product ID           |
| 400    | Variant ID is required       |
| 400    | Product is out of stock      |
| 400    | Insufficient stock           |
| 401    | Not authorized, no token     |
| 404    | Wishlist not found           |
| 404    | Product not in wishlist      |
| 404    | Product not found            |
| 404    | Variant not found            |
| 500    | An unexpected error occurred |
