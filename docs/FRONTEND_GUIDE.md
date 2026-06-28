# Frontend Developer Guide

A comprehensive guide for building the Timsrael Clothing frontend on top of this API. This guide assumes Next.js 14+ (App Router), TypeScript, and Tailwind CSS.

---

## Recommended Stack

| Concern         | Library                   | Why                                                    |
| --------------- | ------------------------- | ------------------------------------------------------ |
| HTTP client     | **Axios**                 | Interceptors for auth token handling                   |
| Server state    | **TanStack Query v5**     | Caching, loading states, refetching                    |
| Forms           | **React Hook Form + Zod** | Type-safe forms, same validation philosophy as backend |
| Global UI state | **Zustand**               | Lightweight, no boilerplate                            |
| Payments        | **react-paystack**        | Official Paystack React library                        |
| File uploads    | **React Dropzone**        | Product/collection image uploads (admin)               |
| Notifications   | **Sonner**                | Toast notifications for cart, errors, success          |
| Date formatting | **date-fns**              | Order dates, return window countdown                   |

---

## Project Structure

```
src/
  app/
    (shop)/
      page.tsx                    — homepage, featured products, collections
      products/
        page.tsx                  — product listing with filters
        [slug]/page.tsx           — product detail
      collections/
        [slug]/page.tsx           — collection detail
      cart/page.tsx               — cart
      checkout/page.tsx           — checkout flow
      payment/verify/page.tsx     — payment confirmation
      orders/
        page.tsx                  — order history
        [id]/page.tsx             — order detail with tracking
    (account)/
      profile/page.tsx            — profile and password change
      addresses/page.tsx          — saved addresses
      wishlist/page.tsx           — wishlist
      returns/page.tsx            — return requests
    (admin)/
      dashboard/page.tsx
      products/
        page.tsx                  — product list
        new/page.tsx              — create product
        [id]/edit/page.tsx        — edit product
      orders/page.tsx
      collections/page.tsx
      coupons/page.tsx
      shipping/page.tsx
      inventory/[productId]/page.tsx
      returns/page.tsx
  lib/
    api.ts                        — Axios instance with interceptors
    queryClient.ts                — TanStack Query client
  store/
    authStore.ts                  — Zustand auth store
    cartStore.ts                  — guest cart state
  hooks/
    useAuth.ts
    useCart.ts
    useProducts.ts
    useOrders.ts
    useWishlist.ts
    useAddresses.ts
    useReviews.ts
    useCollections.ts
    useShipping.ts
    useCoupons.ts
    useReturns.ts
    useInventory.ts
  types/
    api.ts                        — response types matching backend models
  components/
    ui/                           — shared UI components
    shop/                         — product cards, filters, cart items
    checkout/                     — checkout steps, address form, measurements form
    account/                      — profile forms, address cards
    admin/                        — admin tables, forms, dashboards
```

---

## Step 1 — Environment Setup

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Step 2 — Axios Instance with Interceptors

This is the most critical piece. Set it up before anything else.

```ts
// src/lib/api.ts
import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // sends httpOnly refresh token cookie automatically
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post("/auth/refresh");
        const newToken = data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
```

The queue pattern ensures that if multiple requests fail with 401 simultaneously, only one refresh call is made and all queued requests retry with the new token.

---

## Step 3 — Auth Store

```ts
// src/store/authStore.ts
import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthStore {
  accessToken: string | null;
  user: User | null;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null }),
}));
```

> **Never store the access token in localStorage** — it is vulnerable to XSS attacks. Zustand keeps it in memory. On page refresh, the interceptor calls `POST /auth/refresh` to get a new one automatically since the refresh token is in an httpOnly cookie.

---

## Step 4 — TanStack Query Setup

```ts
// src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
```

```tsx
// src/app/layout.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

---

## Step 5 — Custom Hooks Pattern

Every API endpoint becomes a typed custom hook. Here are the most important ones:

```ts
// src/hooks/useProducts.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useProducts = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const { data } = await api.get("/products", { params });
      return data;
    },
  });

export const useProduct = (slug: string) =>
  useQuery({
    queryKey: ["products", slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}`);
      return data.product;
    },
    enabled: !!slug,
  });
```

```ts
// src/hooks/useCart.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useCart = () =>
  useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await api.get("/cart");
      return data.cart;
    },
  });

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: {
      productId: string;
      variantId: string;
      quantity: number;
    }) => api.post("/cart", item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
};
```

---

## Step 6 — Guest Cart

Before the user logs in, cart items are stored in Zustand. On login, they are merged with the server cart.

```ts
// src/store/cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GuestCartItem {
  product: string;
  variantId: string;
  quantity: number;
  price: number;
}

interface CartStore {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.product === item.product && i.variantId === item.variantId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product === item.product && i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product === productId && i.variantId === variantId),
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "guest-cart" }, // persisted to localStorage since no auth risk
  ),
);
```

On login, pass the guest cart and clear it:

```ts
const login = useMutation({
  mutationFn: async (credentials: { email: string; password: string }) => {
    const guestItems = useCartStore.getState().items;
    const { data } = await api.post("/auth/login", {
      ...credentials,
      guestCart: guestItems.length > 0 ? { items: guestItems } : undefined,
    });
    return data;
  },
  onSuccess: (data) => {
    useAuthStore.getState().setAccessToken(data.accessToken);
    useAuthStore.getState().setUser(data.user);
    useCartStore.getState().clear(); // guest cart merged, clear local
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  },
});
```

---

## Step 7 — Checkout Flow

The checkout flow has several steps. Handle them in sequence:

```ts
// src/hooks/useCheckout.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "sonner";

export const useCalculateShipping = () =>
  useMutation({
    mutationFn: (data: { state: string; orderTotal: number }) =>
      api.post("/shipping/calculate", data),
  });

export const useValidateCoupon = () =>
  useMutation({
    mutationFn: (data: { couponCode: string; orderTotal: number }) =>
      api.post("/coupons/validate", data),
  });

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateOrderInput) => api.post("/orders", data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      return response.data.order;
    },
    onError: (error: any) => {
      if (
        error.response?.status === 409 &&
        error.response?.data?.code === "CART_PRICE_UPDATED"
      ) {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        toast.error("Some prices have changed. Your cart has been updated.");
        router.push("/cart");
      }
    },
  });
};

export const useInitializePayment = () =>
  useMutation({
    mutationFn: (data: { orderId: string }) =>
      api.post("/payments/initialize", data),
  });
```

**Checkout sequence in the UI:**

```
1. Customer reviews cart → GET /cart
2. Customer enters address OR selects saved address → POST /shipping/calculate
3. Customer optionally enters coupon → POST /coupons/validate (preview only)
4. Customer fills measurements if required
5. Customer confirms order → POST /orders
   → If 409: redirect to cart with toast
   → If 201: proceed to payment
6. Initialize payment → POST /payments/initialize
7. Use react-paystack inline popup OR redirect to authorizationUrl
8. On payment callback → show success page, poll order status
```

---

## Step 8 — Paystack Integration

```tsx
// Using react-paystack inline popup
import { usePaystackPayment } from "react-paystack";

interface PaystackProps {
  email: string;
  accessCode: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PaystackButton = ({
  email,
  accessCode,
  onSuccess,
  onClose,
}: PaystackProps) => {
  const initializePayment = usePaystackPayment({
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email,
    accessCode,
  });

  return (
    <button onClick={() => initializePayment({ onSuccess, onClose })}>
      Pay Now
    </button>
  );
};
```

> After payment, Paystack redirects to `CLIENT_URL/payment/verify`. At this point the order may still show `pending` — the webhook updates it to `paid` asynchronously. Poll `GET /orders/my/:id` every few seconds until status changes, or show a "Payment received, confirming order..." message.

---

## Step 9 — Measurements Form

```tsx
// src/components/checkout/MeasurementsForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const measurementsSchema = z.object({
  bust: z.number().positive(),
  waist: z.number().positive(),
  hips: z.number().positive(),
  backLength: z.number().positive(),
  halfLength: z.number().positive(),
  sleeveLength: z.number().positive(),
  roundSleeve: z.number().positive(),
  wrist: z.number().positive(),
  waistToHip: z.number().positive(),
  waistToKnee: z.number().positive(),
  skirtOrGownLength: z.number().positive(),
});

const measurementFields = [
  { name: "bust", label: "Bust" },
  { name: "waist", label: "Waist" },
  { name: "hips", label: "Hips" },
  { name: "backLength", label: "Back Length" },
  { name: "halfLength", label: "Half Length (Shoulder to Waist)" },
  { name: "sleeveLength", label: "Sleeve Length" },
  { name: "roundSleeve", label: "Round Sleeve" },
  { name: "wrist", label: "Wrist" },
  { name: "waistToHip", label: "Waist to Hip" },
  { name: "waistToKnee", label: "Waist to Knee" },
  { name: "skirtOrGownLength", label: "Skirt/Gown Length" },
] as const;

interface MeasurementsFormProps {
  variantId: string;
  productName: string;
  onSubmit: (
    variantId: string,
    measurements: z.infer<typeof measurementsSchema>,
  ) => void;
}

export const MeasurementsForm = ({
  variantId,
  productName,
  onSubmit,
}: MeasurementsFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(measurementsSchema),
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(variantId, data))}>
      <h3>Measurements for {productName} (inches)</h3>
      {measurementFields.map((field) => (
        <div key={field.name}>
          <label>{field.label}</label>
          <input
            type="number"
            step="0.1"
            {...register(field.name, { valueAsNumber: true })}
          />
          {errors[field.name] && <span>{errors[field.name]?.message}</span>}
        </div>
      ))}
      <button type="submit">Save Measurements</button>
    </form>
  );
};
```

At checkout, collect measurements per cart item and pass them in `POST /orders`:

```ts
const measurements: Record<string, MeasurementsInput> = {};

// For each cart item that needs measurements:
measurements[variantId] = { bust: 36, waist: 28, ... };

// Then pass to createOrder:
createOrder({
  addressId: selectedAddressId,
  couponCode: appliedCoupon,
  measurements,
});
```

---

## Step 10 — Admin Route Protection

```tsx
// src/components/AdminGuard.tsx
import { useAuthStore } from "@/store/authStore";
import { redirect } from "next/navigation";

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);

  if (!user?.isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
};
```

Wrap all admin pages:

```tsx
// src/app/(admin)/layout.tsx
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminGuard>{children}</AdminGuard>;
}
```

---

## Error Handling Pattern

All API errors follow the same shape:

```ts
// src/lib/errors.ts
import { AxiosError } from "axios";

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? "An unexpected error occurred";
  }
  return "An unexpected error occurred";
};
```

Use in mutations:

```ts
useMutation({
  mutationFn: ...,
  onError: (error) => {
    toast.error(getErrorMessage(error));
  },
});
```

---

## Key Rules to Remember

1. **Access token lives in memory** — never localStorage. On refresh, `POST /auth/refresh` restores it automatically via the httpOnly cookie
2. **withCredentials: true** must be set on the Axios instance — this sends the refresh token cookie cross-origin
3. **Never trust the Paystack redirect** to confirm payment — always wait for the order status to change to `paid` via polling or webhook
4. **Handle 409 on checkout** — when `code: "CART_PRICE_UPDATED"` is returned, invalidate the cart query and redirect to the cart page with a toast
5. **Measurements are keyed by variantId** — not productId. Use the cart item's `variantId` as the key
6. **`POST /coupons/validate` is preview only** — pass `couponCode` in `POST /orders` to actually apply it
7. **Shipping fee is calculated server-side** — `POST /shipping/calculate` is for display only. The server recalculates at checkout
8. **Guest cart uses localStorage via Zustand persist** — this is safe because it contains no sensitive data. Clear it after successful login merge
9. **Admin-only endpoints return 403 if `isAdmin` is false** — guard admin pages client-side too, but never rely solely on frontend guards
10. **File uploads use multipart/form-data** — product and collection image endpoints require this content type, not JSON
