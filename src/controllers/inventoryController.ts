import type { Request, Response } from "express";
import Product from "../models/Product.js";
import InventoryLog from "../models/InventoryLog.js";
import { logInventoryChange } from "../utils/inventoryLogger.js";
import { Types } from "mongoose";
import { manualAdjustmentSchema } from "../validators/inventoryValidators.js";
import { flattenErrors } from "../utils/zodErrors.js";

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const result = manualAdjustmentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { variantId, quantityChange, note } = result.data;

    const product = await Product.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.variants.find(
      (v) => v._id?.toString() === variantId,
    );

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    const newStock = variant.stock + quantityChange;

    if (newStock < 0) {
      return res.status(400).json({
        message: `Adjustment would result in negative stock. Current stock is ${variant.stock}.`,
      });
    }

    await Product.updateOne(
      {
        _id: id,
        "variants._id": new Types.ObjectId(variantId),
      },
      { $inc: { "variants.$.stock": quantityChange } },
    );

    await logInventoryChange({
      productId: id,
      variantId,
      quantityChange,
      reason: "manual_adjustment",
      performedBy: adminId,
      ...(note !== undefined && { note }),
    });

    return res.status(200).json({
      message: "Stock adjusted successfully",
      productId: id,
      variantId,
      quantityChange,
      newStock,
    });
  } catch (error) {
    console.error("[InventoryController] adjustStock:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getInventoryLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string) || 20),
    );
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      InventoryLog.find({ product: id })
        .populate("performedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      InventoryLog.countDocuments({ product: id }),
    ]);

    return res.status(200).json({
      message: "Inventory logs fetched successfully",
      data: logs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[InventoryController] getInventoryLogs:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
