import { Document } from "mongoose";

export interface IShippingTier {
  minOrderValue: number;
  maxOrderValue?: number | undefined;
  additionalFee: number;
}

export interface IShippingZone {
  name: string;
  states: string[];
  baseFee: number;
  tiers: IShippingTier[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShippingZoneDocument extends IShippingZone, Document {}