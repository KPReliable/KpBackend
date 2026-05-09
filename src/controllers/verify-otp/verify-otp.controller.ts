import { Request, Response } from "express";

import { User } from "../../models/Users.model";
import { OTP } from "../../models/OTP.model";

// ---------------- VERIFY OTP CONTROLLER ----------------
export const verifyOTPController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let { verificationId, otp } = req.body;

    // ---------------- SANITIZE INPUTS ----------------
    verificationId = verificationId?.trim();
    otp = otp?.trim();

    // ---------------- REQUIRED VALIDATION ----------------
    if (!verificationId || !otp) {
      res.status(400).json({
        status: "error",
        message:
          "Verification ID and OTP are required",
      });

      return;
    }

    // ---------------- OTP FORMAT VALIDATION ----------------
    const otpRegex = /^[0-9]{6}$/;

    if (!otpRegex.test(otp)) {
      res.status(400).json({
        status: "error",
        message: "Invalid OTP format",
      });

      return;
    }

    // ---------------- FIND OTP RECORD ----------------
    const existingOTP = await OTP.findOne({
      verificationId,
    });

    // OTP EXPIRED OR NOT FOUND
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

    // ---------------- FIND USER ----------------
    const existingUser = await User.findOne({
      email: existingOTP.email,
    });

    if (!existingUser) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });

      return;
    }

    // ---------------- CHECK IF ALREADY VERIFIED ----------------
    // if (existingUser.isVerified) {
    //   // DELETE OTP IF USER ALREADY VERIFIED
    //   await OTP.deleteOne({
    //     verificationId,
    //   });

    //   res.status(400).json({
    //     status: "error",
    //     message: "User already verified",
    //   });

    //   return;
    // }

    // ---------------- VERIFY USER ----------------
    existingUser.isVerified = true;

    await existingUser.save();

    // ---------------- DELETE OTP ----------------
    await OTP.deleteOne({
      verificationId,
    });

    // ---------------- RESPONSE ----------------
    res.status(200).json({
      status: "success",
      message: "OTP verified successfully",

      data: {
        userId: existingUser._id,
        email: existingUser.email,
        mobile: existingUser.mobile,
        isVerified:
          existingUser.isVerified,
      },
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