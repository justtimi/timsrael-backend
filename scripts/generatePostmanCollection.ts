/// <reference types="node" />

import fs from "fs";
import path from "path";

const BASE_URL = "{{baseUrl}}";

interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: { key: string; value: string }[];
    body?: {
      mode: string;
      raw?: string;
      formdata?: { key: string; value: string; type: string }[];
      options?: { raw: { language: string } };
    };
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: { key: string; value: string }[];
    };
  };
}

interface PostmanFolder {
  name: string;
  item: PostmanItem[];
}

const authHeader = {
  key: "Authorization",
  value: "Bearer {{accessToken}}",
};

const jsonHeader = {
  key: "Content-Type",
  value: "application/json",
};

const jsonBody = (obj: object) => ({
  mode: "raw",
  raw: JSON.stringify(obj, null, 2),
  options: { raw: { language: "json" } },
});

const url = (pathStr: string, query?: Record<string, string>) => {
  const segments = pathStr.split("/").filter(Boolean);
  return {
    raw: `${BASE_URL}/${segments.join("/")}${
      query
        ? "?" +
          Object.entries(query)
            .map(([k, v]) => `${k}=${v}`)
            .join("&")
        : ""
    }`,
    host: [BASE_URL],
    path: segments,
    ...(query && {
      query: Object.entries(query).map(([key, value]) => ({ key, value })),
    }),
  };
};

const folders: PostmanFolder[] = [
  {
    name: "Auth",
    item: [
      {
        name: "Register",
        request: {
          method: "POST",
          header: [jsonHeader],
          body: jsonBody({
            name: "Timmy Israel",
            email: "timmy@example.com",
            password: "securepassword",
          }),
          url: url("api/auth/register"),
        },
      },
      {
        name: "Login",
        request: {
          method: "POST",
          header: [jsonHeader],
          body: jsonBody({
            email: "timmy@example.com",
            password: "securepassword",
          }),
          url: url("api/auth/login"),
        },
      },
      {
        name: "Logout",
        request: {
          method: "POST",
          header: [authHeader],
          url: url("api/auth/logout"),
        },
      },
      {
        name: "Refresh Token",
        request: {
          method: "POST",
          header: [],
          url: url("api/auth/refresh"),
        },
      },
      {
        name: "Forgot Password",
        request: {
          method: "POST",
          header: [jsonHeader],
          body: jsonBody({ email: "timmy@example.com" }),
          url: url("api/auth/forgot-password"),
        },
      },
      {
        name: "Reset Password",
        request: {
          method: "POST",
          header: [jsonHeader],
          body: jsonBody({
            token: "reset-token-here",
            newPassword: "newsecurepassword",
          }),
          url: url("api/auth/reset-password"),
        },
      },
    ],
  },
  {
    name: "Users",
    item: [
      {
        name: "Get My Profile",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/users/me"),
        },
      },
      {
        name: "Update My Profile",
        request: {
          method: "PUT",
          header: [authHeader, jsonHeader],
          body: jsonBody({ name: "New Name", email: "newemail@example.com" }),
          url: url("api/users/me"),
        },
      },
      {
        name: "Change Password",
        request: {
          method: "PUT",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            currentPassword: "oldpassword",
            newPassword: "newpassword",
          }),
          url: url("api/users/me/password"),
        },
      },
    ],
  },
  {
    name: "Products",
    item: [
      {
        name: "Get All Products",
        request: {
          method: "GET",
          header: [],
          url: url("api/products", { page: "1", limit: "10" }),
        },
      },
      {
        name: "Get Featured Products",
        request: {
          method: "GET",
          header: [],
          url: url("api/products/featured"),
        },
      },
      {
        name: "Get Product by Slug",
        request: {
          method: "GET",
          header: [],
          url: url("api/products/:slug"),
        },
      },
      {
        name: "Create Product",
        request: {
          method: "POST",
          header: [authHeader],
          body: {
            mode: "formdata",
            formdata: [
              { key: "name", value: "Floral Wrap Dress", type: "text" },
              {
                key: "description",
                value: "A beautiful floral dress",
                type: "text",
              },
              { key: "price", value: "45000", type: "text" },
              {
                key: "category",
                value: "64f1a2b3c4d5e6f7a8b9c0d1",
                type: "text",
              },
              {
                key: "variants",
                value: JSON.stringify([
                  { size: "M", color: "Ivory", hexCode: "#FFFFF0", stock: 10 },
                ]),
                type: "text",
              },
              { key: "status", value: "draft", type: "text" },
              { key: "requiresMeasurements", value: "false", type: "text" },
              { key: "lowStockThreshold", value: "5", type: "text" },
              { key: "images", value: "", type: "file" },
            ],
          },
          url: url("api/products"),
        },
      },
      {
        name: "Update Product",
        request: {
          method: "PUT",
          header: [authHeader, jsonHeader],
          body: jsonBody({ name: "Updated Name", status: "active" }),
          url: url("api/products/:id"),
        },
      },
      {
        name: "Delete Product",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/products/:id"),
        },
      },
      {
        name: "Increment Product View",
        request: {
          method: "POST",
          header: [],
          url: url("api/products/:id/view"),
        },
      },
      {
        name: "Add Product Image",
        request: {
          method: "POST",
          header: [authHeader],
          body: {
            mode: "formdata",
            formdata: [{ key: "image", value: "", type: "file" }],
          },
          url: url("api/products/:id/images"),
        },
      },
      {
        name: "Remove Product Image",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/products/:id/images/:imageId"),
        },
      },
    ],
  },
  {
    name: "Categories",
    item: [
      {
        name: "Get All Categories",
        request: {
          method: "GET",
          header: [],
          url: url("api/categories"),
        },
      },
      {
        name: "Get Category by Slug",
        request: {
          method: "GET",
          header: [],
          url: url("api/categories/:slug"),
        },
      },
      {
        name: "Create Category",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            name: "Dresses",
            description: "All dress styles",
            parent: null,
          }),
          url: url("api/categories"),
        },
      },
    ],
  },
  {
    name: "Cart",
    item: [
      {
        name: "Get Cart",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/cart"),
        },
      },
      {
        name: "Add to Cart",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            productId: "64f1a2b3c4d5e6f7a8b9c0d1",
            variantId: "64f1a2b3c4d5e6f7a8b9c0d2",
            quantity: 1,
          }),
          url: url("api/cart"),
        },
      },
      {
        name: "Update Cart Item",
        request: {
          method: "PUT",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            productId: "64f1a2b3c4d5e6f7a8b9c0d1",
            variantId: "64f1a2b3c4d5e6f7a8b9c0d2",
            quantity: 3,
          }),
          url: url("api/cart"),
        },
      },
      {
        name: "Remove Cart Item",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/cart/:productId/:variantId"),
        },
      },
      {
        name: "Clear Cart",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/cart/clear"),
        },
      },
    ],
  },
  {
    name: "Orders",
    item: [
      {
        name: "Create Order",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            addressId: "64f1a2b3c4d5e6f7a8b9c0d1",
            couponCode: "WELCOME10",
            measurements: {
              "64f1a2b3c4d5e6f7a8b9c0d2": {
                bust: 36,
                waist: 28,
                hips: 38,
                backLength: 15,
                halfLength: 14,
                sleeveLength: 24,
                roundSleeve: 14,
                wrist: 6,
                waistToHip: 8,
                waistToKnee: 18,
                skirtOrGownLength: 40,
              },
            },
          }),
          url: url("api/orders"),
        },
      },
      {
        name: "Get My Orders",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/orders/my", { page: "1", limit: "10" }),
        },
      },
      {
        name: "Get My Order by ID",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/orders/my/:id"),
        },
      },
      {
        name: "Cancel My Order",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/orders/my/:id"),
        },
      },
      {
        name: "Get All Orders (Admin)",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/orders", { page: "1", limit: "10", status: "pending" }),
        },
      },
      {
        name: "Update Order Status (Admin)",
        request: {
          method: "PATCH",
          header: [authHeader, jsonHeader],
          body: jsonBody({ status: "shipped" }),
          url: url("api/orders/:id/status"),
        },
      },
      {
        name: "Add Tracking Event (Admin)",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            status: "shipped",
            note: "Dispatched via GIG Logistics",
          }),
          url: url("api/orders/:id/tracking"),
        },
      },
    ],
  },
  {
    name: "Payments",
    item: [
      {
        name: "Initialize Payment",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({ orderId: "64f1a2b3c4d5e6f7a8b9c0d1" }),
          url: url("api/payments/initialize"),
        },
      },
      {
        name: "Webhook (Paystack)",
        request: {
          method: "POST",
          header: [
            { key: "x-paystack-signature", value: "paystack-signature-here" },
          ],
          body: jsonBody({
            event: "charge.success",
            data: {
              reference: "order_xxx",
              metadata: { orderId: "64f1a2b3c4d5e6f7a8b9c0d1" },
            },
          }),
          url: url("api/payments/webhook"),
        },
      },
    ],
  },
  {
    name: "Addresses",
    item: [
      {
        name: "Get My Addresses",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/addresses"),
        },
      },
      {
        name: "Add Address",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            fullName: "Timmy Israel",
            phone: "08012345678",
            address: "12 Lagos Street",
            city: "Ikeja",
            state: "Lagos",
            country: "Nigeria",
          }),
          url: url("api/addresses"),
        },
      },
      {
        name: "Update Address",
        request: {
          method: "PUT",
          header: [authHeader, jsonHeader],
          body: jsonBody({ city: "Victoria Island" }),
          url: url("api/addresses/:id"),
        },
      },
      {
        name: "Delete Address",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/addresses/:id"),
        },
      },
      {
        name: "Set Default Address",
        request: {
          method: "PATCH",
          header: [authHeader],
          url: url("api/addresses/:id/default"),
        },
      },
    ],
  },
  {
    name: "Wishlist",
    item: [
      {
        name: "Get Wishlist",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/wishlist"),
        },
      },
      {
        name: "Add to Wishlist",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({ productId: "64f1a2b3c4d5e6f7a8b9c0d1" }),
          url: url("api/wishlist"),
        },
      },
      {
        name: "Remove from Wishlist",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/wishlist/:productId"),
        },
      },
      {
        name: "Move to Cart",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({ variantId: "64f1a2b3c4d5e6f7a8b9c0d2" }),
          url: url("api/wishlist/:productId/move-to-cart"),
        },
      },
    ],
  },
  {
    name: "Reviews",
    item: [
      {
        name: "Get Product Reviews",
        request: {
          method: "GET",
          header: [],
          url: url("api/products/:productId/reviews", {
            page: "1",
            limit: "10",
          }),
        },
      },
      {
        name: "Submit Review",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({ rating: 5, comment: "Absolutely love this dress!" }),
          url: url("api/products/:productId/reviews"),
        },
      },
      {
        name: "Delete Review (Admin)",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/products/:productId/reviews/:reviewId"),
        },
      },
    ],
  },
  {
    name: "Collections",
    item: [
      {
        name: "Get All Collections",
        request: {
          method: "GET",
          header: [],
          url: url("api/collections"),
        },
      },
      {
        name: "Get Collection by Slug",
        request: {
          method: "GET",
          header: [],
          url: url("api/collections/:slug"),
        },
      },
      {
        name: "Create Collection",
        request: {
          method: "POST",
          header: [authHeader],
          body: {
            mode: "formdata",
            formdata: [
              { key: "name", value: "Summer Collection", type: "text" },
              {
                key: "description",
                value: "Light pieces for summer",
                type: "text",
              },
              { key: "status", value: "draft", type: "text" },
              { key: "coverImage", value: "", type: "file" },
            ],
          },
          url: url("api/collections"),
        },
      },
      {
        name: "Update Collection",
        request: {
          method: "PUT",
          header: [authHeader, jsonHeader],
          body: jsonBody({ name: "Summer Collection 2025", status: "active" }),
          url: url("api/collections/:id"),
        },
      },
      {
        name: "Update Collection Cover",
        request: {
          method: "PATCH",
          header: [authHeader],
          body: {
            mode: "formdata",
            formdata: [{ key: "coverImage", value: "", type: "file" }],
          },
          url: url("api/collections/:id/cover"),
        },
      },
      {
        name: "Delete Collection",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/collections/:id"),
        },
      },
      {
        name: "Add Product to Collection",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({ productId: "64f1a2b3c4d5e6f7a8b9c0d1" }),
          url: url("api/collections/:id/products"),
        },
      },
      {
        name: "Remove Product from Collection",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/collections/:id/products/:productId"),
        },
      },
    ],
  },
  {
    name: "Shipping",
    item: [
      {
        name: "Get All Shipping Zones",
        request: {
          method: "GET",
          header: [],
          url: url("api/shipping"),
        },
      },
      {
        name: "Calculate Shipping Fee",
        request: {
          method: "POST",
          header: [jsonHeader],
          body: jsonBody({ state: "Lagos", orderTotal: 25000 }),
          url: url("api/shipping/calculate"),
        },
      },
      {
        name: "Create Shipping Zone (Admin)",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            name: "Lagos",
            states: ["Lagos"],
            baseFee: 1500,
            tiers: [
              { minOrderValue: 0, maxOrderValue: 10000, additionalFee: 0 },
              { minOrderValue: 10001, additionalFee: 500 },
            ],
            isActive: true,
          }),
          url: url("api/shipping"),
        },
      },
      {
        name: "Get Shipping Zone by ID (Admin)",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/shipping/:id"),
        },
      },
      {
        name: "Update Shipping Zone (Admin)",
        request: {
          method: "PUT",
          header: [authHeader, jsonHeader],
          body: jsonBody({ baseFee: 2000 }),
          url: url("api/shipping/:id"),
        },
      },
      {
        name: "Delete Shipping Zone (Admin)",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/shipping/:id"),
        },
      },
    ],
  },
  {
    name: "Coupons",
    item: [
      {
        name: "Validate Coupon",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({ couponCode: "WELCOME10", orderTotal: 25000 }),
          url: url("api/coupons/validate"),
        },
      },
      {
        name: "Get All Coupons (Admin)",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/coupons"),
        },
      },
      {
        name: "Create Coupon (Admin)",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            code: "WELCOME10",
            type: "percentage",
            value: 10,
            minOrderValue: 5000,
            usageLimit: 100,
            expiresAt: "2025-12-31T23:59:59.000Z",
            isActive: true,
          }),
          url: url("api/coupons"),
        },
      },
      {
        name: "Get Coupon by ID (Admin)",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/coupons/:id"),
        },
      },
      {
        name: "Update Coupon (Admin)",
        request: {
          method: "PUT",
          header: [authHeader, jsonHeader],
          body: jsonBody({ isActive: false }),
          url: url("api/coupons/:id"),
        },
      },
      {
        name: "Delete Coupon (Admin)",
        request: {
          method: "DELETE",
          header: [authHeader],
          url: url("api/coupons/:id"),
        },
      },
    ],
  },
  {
    name: "Returns",
    item: [
      {
        name: "Submit Return Request",
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            orderId: "64f1a2b3c4d5e6f7a8b9c0d1",
            items: [
              {
                product: "64f1a2b3c4d5e6f7a8b9c0d2",
                variantId: "64f1a2b3c4d5e6f7a8b9c0d3",
                quantity: 1,
              },
            ],
            reason: "The dress arrived in the wrong color.",
          }),
          url: url("api/returns"),
        },
      },
      {
        name: "Get My Return Requests",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/returns/my", { page: "1", limit: "10" }),
        },
      },
      {
        name: "Get All Return Requests (Admin)",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/returns", {
            page: "1",
            limit: "10",
            status: "requested",
          }),
        },
      },
      {
        name: "Review Return Request (Admin)",
        request: {
          method: "PATCH",
          header: [authHeader, jsonHeader],
          body: jsonBody({ status: "approved", adminNote: "Return approved." }),
          url: url("api/returns/:id/review"),
        },
      },
    ],
  },
  {
    name: "Inventory",
    item: [
      {
        name: "Get Inventory Logs",
        request: {
          method: "GET",
          header: [authHeader],
          url: url("api/products/:id/inventory/logs", {
            page: "1",
            limit: "20",
          }),
        },
      },
      {
        name: "Adjust Stock (Admin)",
        request: {
          method: "PATCH",
          header: [authHeader, jsonHeader],
          body: jsonBody({
            variantId: "64f1a2b3c4d5e6f7a8b9c0d1",
            quantityChange: 10,
            note: "Restocked from supplier delivery",
          }),
          url: url("api/products/:id/inventory/adjust"),
        },
      },
    ],
  },
];

const collection = {
  info: {
    name: "Timsrael Clothing API",
    description: "Complete API collection for Timsrael Clothing backend",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000", type: "string" },
    { key: "accessToken", value: "", type: "string" },
  ],
  item: folders,
};

const outputPath = path.join(
  process.cwd(),
  "docs",
  "timsrael-api.postman_collection.json",
);
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
console.log(`✅ Postman collection generated at ${outputPath}`);
