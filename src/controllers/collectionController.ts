import type { Request, Response } from "express";
import Collection from "../models/Collection.js";
import Product from "../models/Product.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";
import type { CollectionSlugParams } from "../types/Collection.js";
import {
  createCollectionSchema,
  updateCollectionSchema,
  addProductToCollectionSchema,
} from "../validators/collectionValidators.js";
import { Types } from "mongoose";
import { flattenErrors } from "../utils/zodErrors.js";

export const createCollection = async (req: Request, res: Response) => {
  try {
    const result = createCollectionSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { name, description, status } = result.data;

    const file = req.file as Express.Multer.File;

    if (!file) {
      return res.status(400).json({ message: "Cover image is required" });
    }

    let coverImage: { url: string; public_id: string };

    try {
      const uploaded = await uploadToCloudinary(file.buffer);
      coverImage = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    } catch (uploadError) {
      return res.status(500).json({ message: "Image upload failed" });
    }

    const collection = await Collection.create({
      name,
      coverImage,
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
    });

    return res.status(201).json({
      message: "Collection created successfully",
      collection,
    });
  } catch (error) {
    console.error("[CollectionController] createCollection:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getCollections = async (req: Request, res: Response) => {
  try {
    const query: Record<string, unknown> = {
      isDeleted: { $ne: true },
    };

    if (!req.user?.isAdmin) {
      query.status = "active";
    }

    const collections = await Collection.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Collections fetched successfully",
      data: collections,
    });
  } catch (error) {
    console.error("[CollectionController] getCollections:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getCollectionBySlug = async (
  req: Request<CollectionSlugParams>,
  res: Response,
) => {
  try {
    const { slug } = req.params;

    const collection = await Collection.findOne({
      slug,
      isDeleted: { $ne: true },
    }).populate("products", "name images price discountPrice status variants");

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.status === "draft" && !req.user?.isAdmin) {
      return res.status(404).json({ message: "Collection not found" });
    }

    return res.status(200).json({
      message: "Collection fetched successfully",
      collection,
    });
  } catch (error) {
    console.error("[CollectionController] getCollectionBySlug:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collection ID" });
    }

    const collection = await Collection.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const result = updateCollectionSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { name, description, status } = result.data;

    if (name !== undefined) collection.name = name;
    if (description !== undefined) collection.description = description;
    if (status !== undefined) collection.status = status;

    await collection.save();

    return res.status(200).json({
      message: "Collection updated successfully",
      collection,
    });
  } catch (error) {
    console.error("[CollectionController] updateCollection:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const updateCollectionCover = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collection ID" });
    }

    const collection = await Collection.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const file = req.file as Express.Multer.File;

    if (!file) {
      return res.status(400).json({ message: "Cover image is required" });
    }

    await cloudinary.uploader.destroy(collection.coverImage.public_id);

    try {
      const uploaded = await uploadToCloudinary(file.buffer);
      collection.coverImage = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    } catch (uploadError) {
      return res.status(500).json({ message: "Image upload failed" });
    }

    await collection.save();

    return res.status(200).json({
      message: "Cover image updated successfully",
      collection,
    });
  } catch (error) {
    console.error("[CollectionController] updateCollectionCover:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collection ID" });
    }

    const collection = await Collection.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    collection.isDeleted = true;
    await collection.save();

    return res.status(200).json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("[CollectionController] deleteCollection:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const addProductToCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collection ID" });
    }

    const result = addProductToCollectionSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { productId } = result.data;

    const collection = await Collection.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const product = await Product.findOne({
      _id: productId,
      isDeleted: { $ne: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const alreadyInCollection = collection.products.some(
      (p) => p.toString() === productId,
    );

    if (alreadyInCollection) {
      return res.status(400).json({
        message: "Product already in collection",
      });
    }

    collection.products.push(new Types.ObjectId(productId));
    await collection.save();

    return res.status(200).json({
      message: "Product added to collection",
      collection,
    });
  } catch (error) {
    console.error("[CollectionController] addProductToCollection:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const removeProductFromCollection = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id, productId } = req.params;

    if (
      !id ||
      typeof id !== "string" ||
      !Types.ObjectId.isValid(id) ||
      !productId ||
      typeof productId !== "string" ||
      !Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const collection = await Collection.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const productIndex = collection.products.findIndex(
      (p) => p.toString() === productId,
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not in collection" });
    }

    collection.products.splice(productIndex, 1);
    await collection.save();

    return res.status(200).json({
      message: "Product removed from collection",
      collection,
    });
  } catch (error) {
    console.error("[CollectionController] removeProductFromCollection:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
