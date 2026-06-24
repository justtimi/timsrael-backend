import { Document, Types } from "mongoose";

export interface IAddress {
  user: Types.ObjectId;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddressDocument extends IAddress, Document {}