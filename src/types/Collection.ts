import { Document, Types } from "mongoose";

export interface ICollectionImage {
  url: string;
  public_id: string;
}

export interface ICollection {
  name: string;
  slug: string;
  description?: string;
  coverImage: ICollectionImage;
  products: Types.ObjectId[];
  status: "active" | "draft";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICollectionDocument extends ICollection, Document {}

export interface CollectionSlugParams {
  slug: string;
}
