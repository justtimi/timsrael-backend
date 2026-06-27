import type { Request, Response } from "express";
import ShippingZone from "../models/ShippingZone.js";
import { Types } from "mongoose";
import {
  createShippingZoneSchema,
  updateShippingZoneSchema,
} from "../validators/shippingZoneValidators.js";

export const createShippingZone = async (req: Request, res: Response) => {
  try {
    const result = createShippingZoneSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, states, baseFee, tiers, isActive } = result.data;

    // Check for state conflicts with existing zones
    const conflictingZone = await ShippingZone.findOne({
      states: { $in: states },
    });

    if (conflictingZone) {
      return res.status(400).json({
        message: `One or more states are already assigned to zone "${conflictingZone.name}"`,
      });
    }

    const zone = await ShippingZone.create({
      name,
      states,
      baseFee,
      ...(tiers !== undefined && { tiers }),
      ...(isActive !== undefined && { isActive }),
    });

    return res.status(201).json({
      message: "Shipping zone created successfully",
      zone,
    });
  } catch (error) {
    console.error("[ShippingZoneController] createShippingZone:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getShippingZones = async (req: Request, res: Response) => {
  try {
    const zones = await ShippingZone.find().sort({ name: 1 });

    return res.status(200).json({
      message: "Shipping zones fetched successfully",
      data: zones,
    });
  } catch (error) {
    console.error("[ShippingZoneController] getShippingZones:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getShippingZoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid zone ID" });
    }

    const zone = await ShippingZone.findById(id);

    if (!zone) {
      return res.status(404).json({ message: "Shipping zone not found" });
    }

    return res.status(200).json({
      message: "Shipping zone fetched successfully",
      zone,
    });
  } catch (error) {
    console.error("[ShippingZoneController] getShippingZoneById:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const updateShippingZone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid zone ID" });
    }

    const zone = await ShippingZone.findById(id);

    if (!zone) {
      return res.status(404).json({ message: "Shipping zone not found" });
    }

    const result = updateShippingZoneSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, states, baseFee, tiers, isActive } = result.data;

    // Check for state conflicts with other zones
    if (states) {
      const conflictingZone = await ShippingZone.findOne({
        _id: { $ne: id },
        states: { $in: states },
      });

      if (conflictingZone) {
        return res.status(400).json({
          message: `One or more states are already assigned to zone "${conflictingZone.name}"`,
        });
      }
    }

    if (name !== undefined) zone.name = name;
    if (states !== undefined) zone.states = states;
    if (baseFee !== undefined) zone.baseFee = baseFee;
    if (tiers !== undefined) zone.tiers = tiers;
    if (isActive !== undefined) zone.isActive = isActive;

    await zone.save();

    return res.status(200).json({
      message: "Shipping zone updated successfully",
      zone,
    });
  } catch (error) {
    console.error("[ShippingZoneController] updateShippingZone:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const deleteShippingZone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid zone ID" });
    }

    const zone = await ShippingZone.findById(id);

    if (!zone) {
      return res.status(404).json({ message: "Shipping zone not found" });
    }

    await zone.deleteOne();

    return res.status(200).json({ message: "Shipping zone deleted successfully" });
  } catch (error) {
    console.error("[ShippingZoneController] deleteShippingZone:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const calculateShippingFee = async (req: Request, res: Response) => {
  try {
    const { state, orderTotal } = req.body;

    if (!state || typeof state !== "string") {
      return res.status(400).json({ message: "State is required" });
    }

    if (orderTotal === undefined || typeof orderTotal !== "number" || orderTotal < 0) {
      return res.status(400).json({ message: "Valid order total is required" });
    }

    const zone = await ShippingZone.findOne({
      states: state,
      isActive: true,
    });

    if (!zone) {
      return res.status(404).json({
        message: "No shipping available for this location",
      });
    }

    const matchingTier = zone.tiers
      .filter((tier) => orderTotal >= tier.minOrderValue)
      .filter((tier) => tier.maxOrderValue === undefined || orderTotal <= tier.maxOrderValue)
      .sort((a, b) => b.minOrderValue - a.minOrderValue)[0];

    const additionalFee = matchingTier?.additionalFee ?? 0;
    const shippingFee = zone.baseFee + additionalFee;

    return res.status(200).json({
      message: "Shipping fee calculated successfully",
      data: {
        zone: zone.name,
        baseFee: zone.baseFee,
        additionalFee,
        shippingFee,
      },
    });
  } catch (error) {
    console.error("[ShippingZoneController] calculateShippingFee:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};