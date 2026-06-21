import { Schema, model, type HydratedDocument } from "mongoose";
import type { IProductDocument } from "../types/Product.js";
import slugify from "slugify";

const productSchema = new Schema<IProductDocument>(
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
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    variants: [
      {
        size: {
          type: String,
          required: true,
        },

        color: {
          type: String,
          required: true,
        },

        hexCode: {
          type: String,
          required: true,
        },

        stock: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    images: [
      {
        url: {
          type: String,
          required: true,
        },

        public_id: {
          type: String,
          required: true,
        },
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "draft"],
      default: "draft",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    sizeChart: [
      {
        label: {
          type: String,
          required: true,
        },
        measurements: {
          type: Map,
          of: Number,
          default: {},
        },
      },
    ],

    requiresMeasurements: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.pre("save", function (this: HydratedDocument<IProductDocument>) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
});

productSchema.index({ name: "text", description: "text" });

const Product = model<IProductDocument>("Product", productSchema);

export default Product;
