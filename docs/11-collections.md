# Collections

Handles lookbooks and product collections. Collections group products together under a named theme (e.g. "Summer Collection", "Streetwear Edit"). A product can belong to multiple collections.

---

## Endpoints

| Method | Path                                   | Auth      | Description                        |
| ------ | -------------------------------------- | --------- | ---------------------------------- |
| GET    | `/collections`                         | 🔓 Public | Get all active collections         |
| GET    | `/collections/:slug`                   | 🔓 Public | Get a collection by slug           |
| POST   | `/collections`                         | 🔑 Admin  | Create a collection                |
| PUT    | `/collections/:id`                     | 🔑 Admin  | Update a collection                |
| PATCH  | `/collections/:id/cover`               | 🔑 Admin  | Update cover image                 |
| DELETE | `/collections/:id`                     | 🔑 Admin  | Soft delete a collection           |
| POST   | `/collections/:id/products`            | 🔑 Admin  | Add a product to a collection      |
| DELETE | `/collections/:id/products/:productId` | 🔑 Admin  | Remove a product from a collection |

---

## Collection Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "name": "Summer Collection",
  "slug": "summer-collection",
  "description": "Light and breezy pieces for the summer season.",
  "coverImage": {
    "url": "https://res.cloudinary.com/...",
    "public_id": "timsrael/collections/abc123"
  },
  "products": [],
  "status": "active",
  "isDeleted": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## GET `/collections`

Fetch all active collections, newest first. Admins also see draft collections.

**Auth:** 🔓 Public

### Response `200`

```json
{
  "message": "Collections fetched successfully",
  "data": []
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 500    | An unexpected error occurred |

---

## GET `/collections/:slug`

Fetch a single collection by slug with its products populated.

**Auth:** 🔓 Public

### URL Parameters

| Parameter | Type   | Description                                  |
| --------- | ------ | -------------------------------------------- |
| `slug`    | string | The collection slug e.g. `summer-collection` |

### Response `200`

```json
{
  "message": "Collection fetched successfully",
  "collection": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Summer Collection",
    "slug": "summer-collection",
    "description": "Light and breezy pieces for the summer season.",
    "coverImage": {},
    "products": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
        "name": "Floral Wrap Dress",
        "images": [],
        "price": 45000,
        "discountPrice": 38000,
        "status": "active",
        "variants": []
      }
    ],
    "status": "active"
  }
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 404    | Collection not found         |
| 500    | An unexpected error occurred |

---

## POST `/collections`

Create a new collection with a cover image.

**Auth:** 🔑 Admin

`Content-Type: multipart/form-data`

| Field         | Type   | Required | Description                                    |
| ------------- | ------ | -------- | ---------------------------------------------- |
| `coverImage`  | File   | Yes      | Cover image file                               |
| `name`        | string | Yes      | Min 1, max 100 characters                      |
| `description` | string | No       | Min 1, max 1000 characters                     |
| `status`      | string | No       | `"active"` or `"draft"`. Defaults to `"draft"` |

### Response `201`

```json
{
  "message": "Collection created successfully",
  "collection": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid request data         |
| 400    | Cover image is required      |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 500    | Image upload failed          |
| 500    | An unexpected error occurred |

---

## PUT `/collections/:id`

Update a collection's name, description, or status. Does not update the cover image — use `PATCH /collections/:id/cover` for that.

**Auth:** 🔑 Admin

### Request Body

```json
{
  "name": "Summer Collection 2025",
  "description": "Updated description",
  "status": "active"
}
```

All fields are optional.

### Response `200`

```json
{
  "message": "Collection updated successfully",
  "collection": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid collection ID        |
| 400    | Invalid request data         |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Collection not found         |
| 500    | An unexpected error occurred |

---

## PATCH `/collections/:id/cover`

Replace the cover image of a collection. The old image is deleted from Cloudinary.

**Auth:** 🔑 Admin

`Content-Type: multipart/form-data`

| Field        | Type | Required |
| ------------ | ---- | -------- |
| `coverImage` | File | Yes      |

### Response `200`

```json
{
  "message": "Cover image updated successfully",
  "collection": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid collection ID        |
| 400    | Cover image is required      |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Collection not found         |
| 500    | Image upload failed          |
| 500    | An unexpected error occurred |

---

## DELETE `/collections/:id`

Soft delete a collection. The collection is hidden from public endpoints but not removed from the database.

**Auth:** 🔑 Admin

### Response `200`

```json
{
  "message": "Collection deleted successfully"
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid collection ID        |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Collection not found         |
| 500    | An unexpected error occurred |

---

## POST `/collections/:id/products`

Add a product to a collection. A product can belong to multiple collections.

**Auth:** 🔑 Admin

### Request Body

```json
{
  "productId": "64f1a2b3c4d5e6f7a8b9c0d3"
}
```

| Field       | Type   | Required | Description                           |
| ----------- | ------ | -------- | ------------------------------------- |
| `productId` | string | Yes      | Valid MongoDB ObjectId of the product |

### Response `200`

```json
{
  "message": "Product added to collection",
  "collection": {}
}
```

### Errors

| Status | Message                       |
| ------ | ----------------------------- |
| 400    | Invalid collection ID         |
| 400    | Invalid request data          |
| 400    | Product already in collection |
| 401    | Not authorized, no token      |
| 403    | Admin access required         |
| 404    | Collection not found          |
| 404    | Product not found             |
| 500    | An unexpected error occurred  |

---

## DELETE `/collections/:id/products/:productId`

Remove a product from a collection.

**Auth:** 🔑 Admin

### URL Parameters

| Parameter   | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| `id`        | string | MongoDB ObjectId of the collection        |
| `productId` | string | MongoDB ObjectId of the product to remove |

### Response `200`

```json
{
  "message": "Product removed from collection",
  "collection": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid ID                   |
| 401    | Not authorized, no token     |
| 403    | Admin access required        |
| 404    | Collection not found         |
| 404    | Product not in collection    |
| 500    | An unexpected error occurred |

---

## Notes

- Slugs are auto-generated from the collection name on creation
- Draft collections are visible to admins but hidden from public endpoints
- A product can belong to multiple collections simultaneously
- Deleting a collection does not delete the products inside it
