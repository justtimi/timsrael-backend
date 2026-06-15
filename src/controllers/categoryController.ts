import type { Request, Response } from "express";
import Category from "../models/Category.js";

interface CategorySlugParams {
  slug: string;
}

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, parent } = req.body;

    const existing = await Category.findOne({ name });

    if (existing) {
      return res.status(400).json({
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name,
      description,
      parent: parent || null,
    });

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();

    return res.status(200).json({
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getCategory = async (
  req: Request<CategorySlugParams>,
  res: Response
) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.status(200).json({
      message: "Category fetched successfully",
      category,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
