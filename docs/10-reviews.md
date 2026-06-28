# Reviews

Handles product reviews and ratings. Only customers who have received a delivered order containing the product can leave a review. Each customer can leave one review per product.

---

## Endpoints

| Method | Path                                     | Auth         | Description               |
| ------ | ---------------------------------------- | ------------ | ------------------------- |
| GET    | `/products/:productId/reviews`           | 🔓 Public    | Get reviews for a product |
| POST   | `/products/:productId/reviews`           | 🔒 Protected | Submit a review           |
| DELETE | `/products/:productId/reviews/:reviewId` | 🔑 Admin     | Delete a review           |

---

## Review Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Timmy Israel"
  },
  "product": "64f1a2b3c4d5e6f7a8b9c0d3",
  "rating": 5,
  "comment": "Absolutely love this dress! The fit is perfect.",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## GET `/products/:productId/reviews`

Fetch paginated reviews for a product, newest first. Also returns the average rating.

**Auth:** 🔓 Public

### URL Parameters

| Parameter   | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| `productId` | string | MongoDB ObjectId of the product |

### Query Parameters

| Parameter | Type   | Default | Description               |
| --------- | ------ | ------- | ------------------------- |
| `page`    | number | `1`     | Page number               |
| `limit`   | number | `10`    | Results per page (max 50) |

### Response `200`

```json
{
  "message": "Reviews fetched successfully",
  "data": [],
  "averageRating": 4.5,
  "pagination": {
    "total": 24,
    "page": 1,
    "pages": 3
  }
}
```

> `averageRating` is rounded to one decimal place. Returns `0` if no reviews exist.

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid product ID           |
| 500    | An unexpected error occurred |

---

## POST `/products/:productId/reviews`

Submit a review for a product. The customer must have a delivered order containing the product. Each customer can only review a product once.

**Auth:** 🔒 Protected

### URL Parameters

| Parameter   | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| `productId` | string | MongoDB ObjectId of the product |

### Request Body

```json
{
  "rating": 5,
  "comment": "Absolutely love this dress! The fit is perfect."
}
```

| Field     | Type   | Required | Validation                 |
| --------- | ------ | -------- | -------------------------- |
| `rating`  | number | Yes      | Integer between 1 and 5    |
| `comment` | string | No       | Min 1, max 1000 characters |

### Response `201`

```json
{
  "message": "Review submitted successfully",
  "review": {}
}
```

### Errors

| Status | Message                                        |
| ------ | ---------------------------------------------- |
| 400    | Invalid product ID                             |
| 400    | Invalid request data                           |
| 400    | You have already reviewed this product         |
| 401    | Not authorized, no token                       |
| 403    | You can only review products you have received |
| 500    | An unexpected error occurred                   |

---

## DELETE `/products/:productId/reviews/:reviewId`

Delete a review. Admin only.

**Auth:** 🔑 Admin

### URL Parameters

| Parameter   | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| `productId` | string | MongoDB ObjectId of the product |
| `reviewId`  | string | MongoDB ObjectId of the review  |

### Response `200`

```json
{
  "message": "Review deleted successfully"
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid review ID            |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Review not found             |
| 500    | An unexpected error occurred |

---

## Notes

- Reviews are only allowed from customers with a `delivered` order containing the product — not just any order
- The database enforces one review per user per product at the index level — duplicate submissions are blocked even under concurrent requests
- `averageRating` is calculated live via aggregation — it always reflects the current state of all reviews
