import type { Request, Response } from "express";
import Product from "../models/Product.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";
import type { ProductSlugParams } from "../types/Product.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidators.js";
import { Types } from "mongoose";

const ALLOWED_SORT_FIELDS = ["createdAt", "price", "name"] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

export const createProduct = async (req: Request, res: Response) => {
  try {
    const result = createProductSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      name,
      description,
      price,
      discountPrice,
      category,
      featured,
      status,
    } = result.data;
    const { variants } = req.body;

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "Product images are required",
      });
    }

    const uploadedImages: { url: string; public_id: string }[] = [];

    for (const file of files) {
      try {
        const result = await uploadToCloudinary(file.buffer);
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (uploadError) {
        await Promise.all(
          uploadedImages.map((img) =>
            cloudinary.uploader.destroy(img.public_id),
          ),
        );
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    let parsedVariants;

    try {
      parsedVariants =
        typeof variants === "string" ? JSON.parse(variants) : variants;
    } catch (error) {
      return res.status(400).json({
        message: "Invalid variants format",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      ...(discountPrice !== undefined && { discountPrice }),
      category: new Types.ObjectId(category),
      variants: parsedVariants,
      images: uploadedImages,
      ...(featured !== undefined && { featured }),
      ...(status !== undefined && { status }),
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("[ProductController] createProduct:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      sort = "createdAt",
      order = "desc",
      minPrice,
      maxPrice,
    } = req.query;

    const query: Record<string, unknown> = {};

    query.isDeleted = { $ne: true };

    if (!req.user?.isAdmin) {
      query.status = "active";
    }

    if (search) {
      const escapedSearch = search
        .toString()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      query.price = priceFilter;
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string) || 10),
    );
    const skip = (pageNum - 1) * limitNum;

    const sortField = ALLOWED_SORT_FIELDS.includes(sort as SortField)
      ? (sort as SortField)
      : "createdAt";

    const sortOrder: Record<string, 1 | -1> = {};
    sortOrder[sortField] = order === "asc" ? 1 : -1;

    const products = await Product.find(query)
      .populate("category")
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[ProductController] getProduct:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getProductBySlug = async (
  req: Request<ProductSlugParams>,
  res: Response,
) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      slug,
      isDeleted: { $ne: true },
    }).populate("category");

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.error("[ProductController] getProductBySlug:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);

    if (!product || product.isDeleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    const result = updateProductSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      name,
      description,
      price,
      discountPrice,
      category,
      featured,
      status,
    } = result.data;
    const { variants } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (discountPrice !== undefined) product.discountPrice = discountPrice;
    if (category !== undefined) product.category = new Types.ObjectId(category);
    if (featured !== undefined) product.featured = featured;
    if (status !== undefined) product.status = status;

    if (variants) {
      try {
        product.variants =
          typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch {
        return res.status(400).json({
          message: "Invalid variants format",
        });
      }
    }

    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      await Promise.all(
        product.images.map((img) => cloudinary.uploader.destroy(img.public_id)),
      );

      const uploadedImages: { url: string; public_id: string }[] = [];

      for (const file of files) {
        try {
          const result = await uploadToCloudinary(file.buffer);
          uploadedImages.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
        } catch (uploadError) {
          await Promise.all(
            uploadedImages.map((img) =>
              cloudinary.uploader.destroy(img.public_id),
            ),
          );
          return res.status(500).json({ message: "Image upload failed" });
        }
      }

      product.images = uploadedImages;
    }

    await product.save();

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("[ProductController] updateProduct:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    product.isDeleted = true;
    await product.save();

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("[ProductController] deleteProduct:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({
      featured: true,
      status: "active",
      isDeleted: { $ne: true },
    }).populate("category");

    return res.status(200).json({
      message: "Featured products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("[ProductController] getFeaturedProducts:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const incrementProductView = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
      { $inc: { views: 1 } },
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "View recorded" });
  } catch (error) {
    console.error("[ProductController] incrementProductView:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
