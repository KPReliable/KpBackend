import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IOTP extends Document {
  verificationId: string;
  otp: string;

  createdAt?: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    verificationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    otp: {
      type: String,
      required: true,
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Auto delete after 5 minutes
    },
  },
  {
    timestamps: false,
  }
);

export const OTP: Model<IOTP> =
  mongoose.models.OTP ||
  mongoose.model<IOTP>("OTP", otpSchema);