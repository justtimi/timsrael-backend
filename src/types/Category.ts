import { Document } from "mongoose";

interface ICategory {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | null;
}

export interface ICategoryDocument extends ICategory, Document {}