import { Request, Response } from "express";
import crypto from "crypto";

import { User } from "../../models/Users.model";
import { OTP } from "../../models/OTP.model";

// ---------------- REGISTER CONTROLLER ----------------
export const registerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      orgName,
      email,
      mobile,
      countryCode,
    } = req.body;

    // ---------------- VALIDATION ----------------
    if (
      !name ||
      !orgName ||
      !email ||
      !mobile ||
      !countryCode
    ) {
      res.status(400).json({
        status: "error",
        message: "All fields are required",
      });

      return;
    }

    // ---------------- CHECK EXISTING USER ----------------
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { mobile },
      ],
    });
 
    if (!existingUser) {
    await User.create({
    name,
    orgName,
    email,
    mobile,
    countryCode,
  });
}
    
    // ---------------- HARDCODED OTP ----------------
    const generatedOTP = "123456";

    // ---------------- GENERATE VERIFICATION ID ----------------
    const verificationId =
      crypto.randomBytes(16).toString("hex");

    // ---------------- OVERRIDE EXISTING OTP ----------------
    await OTP.findOneAndUpdate(
      {
        verificationId,
      },
      {
        verificationId,
        otp: generatedOTP,
      },
      {
        upsert: true,
        new: true,
      }
    );

    // ---------------- RESPONSE ----------------
    res.status(200).json({
      status: "success",
      message: "OTP generated successfully",
      data: {
        verificationId,
        otp: generatedOTP,
      },
    });
  } catch (error) {
    console.error(
      "REGISTER CONTROLLER ERROR:",
      error
    );

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};