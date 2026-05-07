import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  orgName: string;
  email: string;
  mobile: string;
  countryCode: string;

  role?: "user" | "admin";

  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    orgName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    countryCode: {
      type: String,
      required: true,
      default: "+91",
      trim: true,
    },

  
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);