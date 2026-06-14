import { Document } from "mongoose";

interface IUser {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  refreshToken?: string | undefined;

resetPasswordToken?: string | undefined;
resetPasswordExpires?: Date | undefined;
}

export interface IUserDocument extends IUser, Document {}