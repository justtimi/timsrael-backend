import InventoryLog from "../models/InventoryLog.js";
import type { InventoryLogReason } from "../types/InventoryLog.js";
import type { ClientSession } from "mongoose";

interface LogInventoryChangeParams {
  productId: string;
  variantId: string;
  quantityChange: number;
  reason: InventoryLogReason;
  performedBy: string;
  note?: string;
  session?: ClientSession;
}

export const logInventoryChange = async ({
  productId,
  variantId,
  quantityChange,
  reason,
  performedBy,
  note,
  session,
}: LogInventoryChangeParams): Promise<void> => {
  await InventoryLog.create(
    [
      {
        product: productId,
        variantId,
        quantityChange,
        reason,
        performedBy,
        ...(note !== undefined && { note }),
      },
    ],
    { session },
  );
};