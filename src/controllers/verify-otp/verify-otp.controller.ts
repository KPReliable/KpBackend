import { Request, Response } from "express";

import { User } from "../../models/Users.model";
import { OTP } from "../../models/OTP.model";

// ---------------- VERIFY OTP CONTROLLER ----------------
export const verifyOTPController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      verificationId,
      otp,
      name,
      orgName,
      email,
      mobile,
      countryCode,
    } = req.body;

    // ---------------- CHECK OTP RECORD ----------------
    const existingOTP = await OTP.findOne({
      verificationId,
    });

    if (!existingOTP) {
      res.status(404).json({
        status: "error",
        message:
          "OTP expired or verification not found",
      });

      return;
    }

    // ---------------- VERIFY OTP ----------------
    if (existingOTP.otp !== otp) {
      res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });

      return;
    }

    // ---------------- CREATE USER ----------------
    const createdUser = await User.create({
      name,
      orgName,
      email,
      mobile,
      countryCode,
    });

    // ---------------- DELETE OTP ----------------
    await OTP.deleteOne({
      verificationId,
    });

    // ---------------- RESPONSE ----------------
    res.status(201).json({
      status: "success",
      message:
        "User verified and registered successfully",
      data: createdUser,
    });
  } catch (error) {
    console.error(
      "VERIFY OTP CONTROLLER ERROR:",
      error
    );

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};