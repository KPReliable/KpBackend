import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IOTP extends Document {
  email: string;
  mobile: string;

  verificationId: string;
  otp: string;

  expiresAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    verificationId: {
      type: String,
      required: true,
      trim: true,
    },

    otp: {
      type: String,
      required: true,
      trim: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL index
    },
  },
  {
    timestamps: true,
  }
);

export const OTP: Model<IOTP> =
  mongoose.models.OTP ||
  mongoose.model<IOTP>("OTP", otpSchema);