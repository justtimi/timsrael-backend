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

export interface ISizeChartEntry {
  label: string;
  measurements: Record<string, number>;
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
  sizeChart: ISizeChartEntry[];
  requiresMeasurements: boolean;
  lowStockThreshold: number;
}

export interface IProductDocument extends IProduct, Document {}
