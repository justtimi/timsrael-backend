import type { Request, Response } from "express";
import Product from "../models/Product.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";

interface ProductSlugParams {
  slug: string;
}

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      variants,
      featured,
      status,
    } = req.body;

    // 1. Handle images
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "Product images are required",
      });
    }

    // 2. Upload images to Cloudinary
    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        const result = await uploadToCloudinary(file.buffer);

        return {
          url: result.secure_url,
          public_id: result.public_id,
        };
      })
    );

    // 3. Parse variants (because they come as string from form-data)
    let parsedVariants;

    try {
      parsedVariants =
        typeof variants === "string"
          ? JSON.parse(variants)
          : variants;
    } catch (error) {
      return res.status(400).json({
        message: "Invalid variants format",
      });
    }

    // 4. Create product
    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      category,
      variants: parsedVariants,
      images: uploadedImages,
      featured,
      status,
    });

    // 5. Response
    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
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

    const query: any = {};

    // 1. Search by name
    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    // 2. Filter by category
    if (category) {
      query.category = category;
    }

    // 3. Price filtering
    if (minPrice || maxPrice) {
      query.price = {};

      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 4. Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // 5. Sort logic
    const sortOrder: any = {};
    sortOrder[sort as string] = order === "asc" ? 1 : -1;

    // 6. Query DB
    const products = await Product.find(query)
      .populate("category")
      .sort(sortOrder)
      .skip(skip)
      .limit(Number(limit));

    // 7. Total count (for frontend pagination)
    const total = await Product.countDocuments(query);

    return res.status(200).json({
      message: "Products fetched successfully",
      data: products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getProductBySlug = async (
  req: Request<ProductSlugParams>,
  res: Response
) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug }).populate("category");

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const {
      name,
      description,
      price,
      discountPrice,
      category,
      variants,
      featured,
      status,
    } = req.body;

    // 1. Update basic fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (discountPrice) product.discountPrice = discountPrice;
    if (category) product.category = category;
    if (featured !== undefined) product.featured = featured;
    if (status) product.status = status;

    // 2. Update variants (if provided)
    if (variants) {
      try {
        product.variants =
          typeof variants === "string"
            ? JSON.parse(variants)
            : variants;
      } catch {
        return res.status(400).json({
          message: "Invalid variants format",
        });
      }
    }

    // 3. Handle new images (optional replacement or addition)
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const result = await uploadToCloudinary(file.buffer);

          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );

      // Replace images (you can change this to "push" if you want additive behavior)
      product.images = uploadedImages;
    }

    // 4. Save (slug middleware will run if name changed)
    await product.save();

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // 1. Delete images from Cloudinary
    await Promise.all(
      product.images.map(async (img) => {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      })
    );

    // 2. Delete product from DB
    await product.deleteOne();

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};