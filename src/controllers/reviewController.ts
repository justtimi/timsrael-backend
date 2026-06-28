import type { Request, Response } from "express";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { Types } from "mongoose";
import { createReviewSchema } from "../validators/reviewValidators.js";
import { flattenErrors } from "../utils/zodErrors.js";

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (
      !productId ||
      typeof productId !== "string" ||
      !Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const result = createReviewSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { rating, comment } = result.data;

    // Verify the user has actually ordered and received this product
    const hasOrdered = await Order.exists({
      user: userId,
      "items.product": new Types.ObjectId(productId),
      status: "delivered",
    });

    if (!hasOrdered) {
      return res.status(403).json({
        message: "You can only review products you have received",
      });
    }

    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    const review = await Review.create({
      user: userId,
      product: new Types.ObjectId(productId),
      rating,
      ...(comment !== undefined && { comment }),
    });

    await review.populate("user", "name");

    return res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("[ReviewController] createReview:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (
      !productId ||
      typeof productId !== "string" ||
      !Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments({ product: productId }),
    ]);

    const averageRating =
      total > 0
        ? await Review.aggregate([
            { $match: { product: new Types.ObjectId(productId) } },
            { $group: { _id: null, avg: { $avg: "$rating" } } },
          ]).then((result) => Math.round((result[0]?.avg ?? 0) * 10) / 10)
        : 0;

    return res.status(200).json({
      message: "Reviews fetched successfully",
      data: reviews,
      averageRating,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[ReviewController] getProductReviews:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    if (
      !reviewId ||
      typeof reviewId !== "string" ||
      !Types.ObjectId.isValid(reviewId)
    ) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("[ReviewController] deleteReview:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
