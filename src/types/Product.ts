import { Document, Types } from "mongoose";

interface IVariant {
  _id?: Types.ObjectId;
  size: string;
  color: string;
  hexCode: string;
  stock: number;
}

interface IImage {
  _id?: Types.ObjectId;
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
  tags: string[];
}

export interface IProductDocument extends IProduct, Document {}
