# Users

Handles the authenticated user's own profile and password management.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | 🔒 Protected | Get own profile |
| PUT | `/users/me` | 🔒 Protected | Update name or email |
| PUT | `/users/me/password` | 🔒 Protected | Change password |

---

## GET `/users/me`

Fetch the currently authenticated user's profile.

**Auth:** 🔒 Protected

### Response `200`

```json
{
  "message": "Profile fetched successfully",
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Timmy Israel",
    "email": "timmy@example.com",
    "isAdmin": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Sensitive fields (`password`, `refreshToken`, `resetPasswordToken`, `resetPasswordExpires`) are never returned.

### Errors

| Status | Message |
|--------|---------|
| 401 | Not authorized, no token |
| 404 | User not found |
| 500 | An unexpected error occurred |

---

## PUT `/users/me`

Update the authenticated user's name or email. At least one field must be provided.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "name": "Timmy Israel",
  "email": "newemail@example.com"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | No | Min 1, max 100 characters |
| `email` | string | No | Valid email format |

At least one of `name` or `email` must be provided.

### Response `200`

```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Timmy Israel",
    "email": "newemail@example.com",
    "isAdmin": false
  }
}
```

### Errors

| Status | Message |
|--------|---------|
| 400 | Invalid request data |
| 400 | At least one field must be provided |
| 400 | Email already in use |
| 401 | Not authorized, no token |
| 404 | User not found |
| 500 | An unexpected error occurred |

---

## PUT `/users/me/password`

Change the authenticated user's password. Requires the current password for verification.

**Auth:** 🔒 Protected

### Request Body

```json
{
  "currentPassword": "oldsecurepassword",
  "newPassword": "newsecurepassword"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `currentPassword` | string | Yes | Must match current password |
| `newPassword` | string | Yes | Min 8, max 100 characters |

### Response `200`

```json
{
  "message": "Password changed successfully"
}
```

### Errors

| Status | Message |
|--------|---------|
| 400 | Invalid request data |
| 400 | Current password is incorrect |
| 400 | New password must be different from current password |
| 401 | Not authorized, no token |
| 404 | User not found |
| 500 | An unexpected error occurred |