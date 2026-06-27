# Products

Handles product creation, retrieval, updates, soft deletion, image management, and view tracking.

---

## Endpoints

| Method | Path                            | Auth     | Description                    |
| ------ | ------------------------------- | -------- | ------------------------------ |
| POST   | `/products`                     | 🔒 Admin | Create a product               |
| GET    | `/products`                     | Public   | Get all products               |
| GET    | `/products/featured`            | Public   | Get featured products          |
| GET    | `/products/:slug`               | Public   | Get product by slug            |
| PUT    | `/products/:id`                 | 🔒 Admin | Update a product               |
| DELETE | `/products/:id`                 | 🔒 Admin | Soft delete a product          |
| POST   | `/products/:id/view`            | Public   | Increment view count           |
| POST   | `/products/:id/images`          | 🔒 Admin | Add an image to a product      |
| DELETE | `/products/:id/images/:imageId` | 🔒 Admin | Remove an image from a product |

---

## Product Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "name": "Floral Wrap Dress",
  "slug": "floral-wrap-dress",
  "description": "A lightweight floral wrap dress...",
  "price": 45000,
  "discountPrice": 38000,
  "category": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Dresses"
  },
  "variants": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
      "size": "M",
      "color": "Ivory",
      "hexCode": "#FFFFF0",
      "stock": 12
    }
  ],
  "images": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d4",
      "url": "https://res.cloudinary.com/...",
      "public_id": "timsrael/products/abc123"
    }
  ],
  "tags": ["summer", "floral"],
  "featured": false,
  "status": "active",
  "views": 42,
  "isDeleted": false,
  "requiresMeasurements": true,
  "allowCustomMeasurements": false,
  "lowStockThreshold": 5,
  "sizeChart": [
    {
      "label": "S",
      "measurements": { "bust": 34, "waist": 27, "hips": 37 }
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

> All prices are in **NGN (kobo not used — whole naira values)**.

---

## POST `/products`

Create a new product. Requires multipart/form-data due to image uploads.

**Auth:** 🔒 Admin

### Request

`Content-Type: multipart/form-data`

| Field                      | Type     | Required           | Validation                                                                       |
| -------------------------- | -------- | ------------------ | -------------------------------------------------------------------------------- |
| `images`                   | File[]   | Yes                | 1–6 image files                                                                  |
| `name`                     | string   | Yes                | Min 1 character                                                                  |
| `description`              | string   | Yes                | Min 1 character                                                                  |
| `price`                    | number   | Yes                | Min 0                                                                            |
| `category`                 | string   | Yes                | Valid MongoDB ObjectId                                                           |
| `variants`                 | array    | Yes                | At least one variant required                                                    |
| `variants[].size`          | string   | Yes                | Min 1 character                                                                  |
| `variants[].color`         | string   | Yes                | Min 1 character                                                                  |
| `variants[].hexCode`       | string   | Yes                | Valid hex color e.g. `#FF5733`                                                   |
| `variants[].stock`         | number   | Yes                | Integer, min 0                                                                   |
| `discountPrice`            | number   | No                 | Min 0                                                                            |
| `featured`                 | boolean  | No                 | Defaults to `false`                                                              |
| `status`                   | string   | No                 | `"active"` or `"draft"`. Defaults to `"draft"`                                   |
| `tags`                     | string[] | No                 | Array of strings                                                                 |
| `lowStockThreshold`        | number   | No                 | Integer, min 0. Defaults to `5`                                                  |
| `requiresMeasurements`     | boolean  | No                 | Defaults to `false`                                                              |
| `allowCustomMeasurements`  | boolean  | No                 | Defaults to `false`                                                              |
| `sizeChart`                | array    | No                 | Array of size chart entries                                                      |
| `sizeChart[].label`        | string   | Yes (if sizeChart) | e.g. `"S"`, `"M"`, `"L"`                                                         |
| `sizeChart[].measurements` | object   | Yes (if sizeChart) | Key-value pairs of measurement name to number e.g. `{ "bust": 34, "waist": 27 }` |

### Response `201`

```json
{
  "message": "Product created successfully",
  "product": {}
}
```

### Errors

| Status | Message                              |
| ------ | ------------------------------------ |
| 400    | Invalid request data                 |
| 400    | Product images are required          |
| 400    | Maximum 6 images allowed per product |
| 401    | Not authorized, no token             |
| 403    | Not authorized as admin              |
| 500    | Image upload failed                  |
| 500    | An unexpected error occurred         |

---

## GET `/products`

Fetch all products. Supports filtering, searching, sorting, and pagination.

**Auth:** Public (admins also see `draft` products)

### Query Parameters

| Parameter  | Type               | Default     | Description                                 |
| ---------- | ------------------ | ----------- | ------------------------------------------- |
| `page`     | number             | `1`         | Page number                                 |
| `limit`    | number             | `10`        | Results per page (max 100)                  |
| `search`   | string             | —           | Search by name or description               |
| `category` | string             | —           | Filter by category ObjectId                 |
| `tags`     | string or string[] | —           | Filter by one or more tags                  |
| `minPrice` | number             | —           | Minimum price filter                        |
| `maxPrice` | number             | —           | Maximum price filter                        |
| `sort`     | string             | `createdAt` | Sort field: `createdAt`, `price`, or `name` |
| `order`    | string             | `desc`      | Sort direction: `asc` or `desc`             |

### Response `200`

```json
{
  "message": "Products fetched successfully",
  "data": [],
  "pagination": {
    "total": 48,
    "page": 1,
    "pages": 5
  }
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 500    | An unexpected error occurred |

---

## GET `/products/featured`

Fetch all active featured products. No pagination.

**Auth:** Public

### Response `200`

```json
{
  "message": "Featured products fetched successfully",
  "data": []
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 500    | An unexpected error occurred |

---

## GET `/products/:slug`

Fetch a single product by its slug.

**Auth:** Public

### Response `200`

```json
{
  "message": "Product fetched successfully",
  "product": {}
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 404    | Product not found            |
| 500    | An unexpected error occurred |

---

## PUT `/products/:id`

Update an existing product. All fields are optional. If new images are uploaded, all existing images are replaced.

**Auth:** 🔒 Admin

`Content-Type: multipart/form-data`

### Request Body

All fields from `POST /products` are accepted but optional.

> **Note:** Uploading new images via `images` replaces **all** existing images. To add or remove individual images, use the image management endpoints below.

### Response `200`

```json
{
  "message": "Product updated successfully",
  "product": {}
}
```

### Errors

| Status | Message                              |
| ------ | ------------------------------------ |
| 400    | Invalid product ID                   |
| 400    | Invalid request data                 |
| 400    | Maximum 6 images allowed per product |
| 401    | Not authorized, no token             |
| 403    | Not authorized as admin              |
| 404    | Product not found                    |
| 500    | Image upload failed                  |
| 500    | An unexpected error occurred         |

---

## DELETE `/products/:id`

Soft delete a product. The product is not removed from the database — it is hidden from all public endpoints.

**Auth:** 🔒 Admin

### Response `200`

```json
{
  "message": "Product deleted successfully"
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid product ID           |
| 401    | Not authorized, no token     |
| 403    | Not authorized as admin      |
| 404    | Product not found            |
| 500    | An unexpected error occurred |

---

## POST `/products/:id/view`

Increment the view count for a product. Call this when a user opens a product detail page.

**Auth:** Public

### Response `200`

```json
{
  "message": "View recorded"
}
```

### Errors

| Status | Message                      |
| ------ | ---------------------------- |
| 400    | Invalid product ID           |
| 404    | Product not found            |
| 500    | An unexpected error occurred |

---

## POST `/products/:id/images`

Add a single image to an existing product without replacing existing images.

**Auth:** 🔒 Admin

`Content-Type: multipart/form-data`

| Field   | Type | Required |
| ------- | ---- | -------- |
| `image` | File | Yes      |

### Response `201`

```json
{
  "message": "Image added successfully",
  "product": {}
}
```

### Errors

| Status | Message                              |
| ------ | ------------------------------------ |
| 400    | Invalid product ID                   |
| 400    | Image is required                    |
| 400    | Maximum 6 images allowed per product |
| 401    | Not authorized, no token             |
| 403    | Not authorized as admin              |
| 404    | Product not found                    |
| 500    | Image upload failed                  |
| 500    | An unexpected error occurred         |

---

## DELETE `/products/:id/images/:imageId`

Remove a specific image from a product by its `_id`. A product must retain at least one image.

**Auth:** 🔒 Admin

### Response `200`

```json
{
  "message": "Image removed successfully",
  "product": {}
}
```

### Errors

| Status | Message                              |
| ------ | ------------------------------------ |
| 400    | Invalid ID                           |
| 401    | Not authorized, no token             |
| 403    | Not authorized as admin              |
| 404    | Product not found                    |
| 404    | Image not found on product           |
| 400    | Product must have at least one image |
| 500    | An unexpected error occurred         |
