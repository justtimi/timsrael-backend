import { Schema, model, type HydratedDocument } from "mongoose";
import type { ICollectionDocument } from "../types/Collection.js";
import slugify from "slugify";

const collectionSchema = new Schema<ICollectionDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    coverImage: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },

    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    status: {
      type: String,
      enum: ["active", "draft"],
      default: "draft",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

collectionSchema.pre(
  "save",
  function (this: HydratedDocument<ICollectionDocument>) {
    if (this.isModified("name")) {
      this.slug = slugify(this.name, {
        lower: true,
        strict: true,
      });
    }
  },
);

collectionSchema.index({ slug: 1 });
collectionSchema.index({ status: 1, isDeleted: 1 });

const Collection = model<ICollectionDocument>("Collection", collectionSchema);

export default Collection;