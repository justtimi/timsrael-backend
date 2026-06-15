import { Schema, model, type HydratedDocument } from "mongoose";
import slugify from "slugify";
import type { ICategoryDocument } from "../types/Category.js";

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
    },

    description: {
      type: String,
    },

    image: {
      type: String,
    },

    parent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre("save", function (this: HydratedDocument<ICategoryDocument>) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
});

const Category = model<ICategoryDocument>("Category", categorySchema);

export default Category;