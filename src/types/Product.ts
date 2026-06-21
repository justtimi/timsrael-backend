import { Document, Types } from "mongoose";

interface IVariant {
  _id: Types.ObjectId;
  size: string;
  color: string;
  stock: number;
}

interface IImage {
  url: string;
  public_id: string;
}

export interface ProductSlugParams {
  slug: string;
}

interface IProduct {
  name: string;
  slug: string;
  description: string;

  price: number;
  discountPrice?: number;

  category: Types.ObjectId;

  variants: IVariant[];

  images: IImage[];

  featured: boolean;

  status: "active" | "draft";

  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  views: number;
}

export interface IProductDocument extends IProduct, Document {}
