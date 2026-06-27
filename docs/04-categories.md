# Categories

Handles product category creation and retrieval. Categories support a parent-child hierarchy for nested categorization (e.g. "Clothing" → "Dresses").

---

## Endpoints

| Method | Path                | Auth      | Description            |
| ------ | ------------------- | --------- | ---------------------- |
| POST   | `/categories`       | 🔑 Admin  | Create a category      |
| GET    | `/categories`       | 🔓 Public | Get all categories     |
| GET    | `/categories/:slug` | 🔓 Public | Get a category by slug |

---

## Category Object

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "name": "Dresses",
  "slug": "dresses",
  "description": "All dress styles",
  "parent": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

> `parent` is either `null` (top-level category) or a MongoDB ObjectId referencing another category.

---

## POST `/categories`

Create a new category. Category names must be unique.

**Auth:** 🔑 Admin

### Request Body

```json
{
  "name": "Dresses",
  "description": "All dress styles",
  "parent": "64f1a2b3c4d5e6f7a8b9c0d2"
}
```

| Field         | Type   | Required | Description                                       |
| ------------- | ------ | -------- | ------------------------------------------------- |
| `name`        | string | Yes      | Unique category name                              |
| `description` | string | No       | Short description                                 |
| `parent`      | string | No       | ObjectId of parent category for nested categories |

### Response `201`

```json
{
  "message": "Category created successfully",
  "category": {}
}
```

### Errors

| Status | Message                  |
| ------ | ------------------------ |
| 400    | Category already exists  |
| 401    | Not authorized, no token |
| 403    | Admin access required    |
| 500    | Server error             |

---

## GET `/categories`

Fetch all categories.

**Auth:** 🔓 Public

### Response `200`

```json
{
  "message": "Categories fetched successfully",
  "categories": []
}
```

### Errors

| Status | Message      |
| ------ | ------------ |
| 500    | Server error |

---

## GET `/categories/:slug`

Fetch a single category by its slug.

**Auth:** 🔓 Public

### URL Parameters

| Parameter | Type   | Description                      |
| --------- | ------ | -------------------------------- |
| `slug`    | string | The category slug e.g. `dresses` |

### Response `200`

```json
{
  "message": "Category fetched successfully",
  "category": {}
}
```

### Errors

| Status | Message            |
| ------ | ------------------ |
| 404    | Category not found |
| 500    | Server error       |

---

## Notes

- Slugs are auto-generated from the category name on creation
- There are currently no update or delete category endpoints — contact the backend developer to rename or remove categories directly
