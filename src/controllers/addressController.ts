import type { Request, Response } from "express";
import Address from "../models/Address.js";
import { Types } from "mongoose";
import {
  createAddressSchema,
  updateAddressSchema,
} from "../validators/addressValidators.js";

const MAX_ADDRESSES = 5;

export const getMyAddresses = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const addresses = await Address.find({ user: userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Addresses fetched successfully",
      data: addresses,
    });
  } catch (error) {
    console.error("[AddressController] getMyAddresses:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const result = createAddressSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const count = await Address.countDocuments({ user: userId });

    if (count >= MAX_ADDRESSES) {
      return res.status(400).json({
        message: `Maximum ${MAX_ADDRESSES} addresses allowed. Please delete one before adding a new one.`,
      });
    }

    const isFirst = count === 0;

    const address = await Address.create({
      user: userId,
      ...result.data,
      isDefault: isFirst,
    });

    return res.status(201).json({
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.error("[AddressController] addAddress:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const result = updateAddressSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    Object.assign(address, result.data);
    await address.save();

    return res.status(200).json({
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("[AddressController] updateAddress:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await address.deleteOne();

    // If deleted address was default, assign default to the most recent remaining address
    if (address.isDefault) {
      const nextAddress = await Address.findOne({ user: userId }).sort({
        createdAt: -1,
      });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("[AddressController] deleteAddress:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Unset current default then set new one
    await Address.updateOne(
      { user: userId, isDefault: true },
      { isDefault: false },
    );

    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("[AddressController] setDefaultAddress:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
