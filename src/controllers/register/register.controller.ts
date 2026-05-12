import { Request, Response } from "express";
import crypto from "crypto";

import { User } from "../../models/Users.model";
import { OTP } from "../../models/OTP.model";
import connectDb from "../../DBconnection/connectDb";
import twilio from "twilio";

// ---------------- REGISTER CONTROLLER ----------------
export const registerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await connectDb();  // Ensure connection before operations

    let {
      name,
      orgName,
      email,
      mobile,
      countryCode,
    } = req.body;

    // ---------------- SANITIZE INPUTS ----------------
    name = name?.trim();
    orgName = orgName?.trim();
    email = email?.trim().toLowerCase();
    mobile = mobile?.trim();
    countryCode = countryCode?.trim();

    // ---------------- REQUIRED VALIDATION ----------------
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

    // ---------------- NAME VALIDATION ----------------
    const nameRegex = /^[A-Za-z\s]{2,50}$/;

    if (!nameRegex.test(name)) {
      res.status(400).json({
        status: "error",
        message:
          "Name must contain only letters and spaces",
      });

      return;
    }

    // ---------------- ORGANIZATION VALIDATION ----------------
    const orgNameRegex =
      /^[A-Za-z0-9\s&.,'-]{2,100}$/;

    if (!orgNameRegex.test(orgName)) {
      res.status(400).json({
        status: "error",
        message: "Invalid organization name",
      });

      return;
    }

    // ---------------- EMAIL VALIDATION ----------------
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });

      return;
    }

    // ---------------- MOBILE VALIDATION ----------------
    const mobileRegex = /^[0-9]{10}$/;

    if (!mobileRegex.test(mobile)) {
      res.status(400).json({
        status: "error",
        message:
          "Mobile number must be 10 digits",
      });

      return;
    }

    // ---------------- COUNTRY CODE VALIDATION ----------------
    const countryCodeRegex = /^\+\d{1,4}$/;

    if (!countryCodeRegex.test(countryCode)) {
      res.status(400).json({
        status: "error",
        message:
          "Invalid country code format",
      });

      return;
    }

    // ---------------- CHECK EMAIL USER ----------------
    const existingEmailUser =
      await User.findOne({ email });

    if (
      existingEmailUser &&
      existingEmailUser.mobile !== mobile
    ) {
      res.status(409).json({
        status: "error",
        message:
          "Email already linked with another account",
      });

      return;
    }

    // ---------------- CHECK MOBILE USER ----------------
    const existingMobileUser =
      await User.findOne({ mobile });

    if (
      existingMobileUser &&
      existingMobileUser.email !== email
    ) {
      res.status(409).json({
        status: "error",
        message:
          "Mobile already linked with another account",
      });

      return;
    }

    // ---------------- FIND OR CREATE USER ----------------
    let user = await User.findOne({ email })
    const isNewUser = !user;

    if (!(user?.booked)) {
      user = await User.create({
        name,
        orgName,
        email,
        mobile,
        countryCode,

        isVerified: false,
      });
    }

    // ---------------- GENERATE OTP ----------------
 // ---------------- CHECK OTP COOLDOWN ----------------
const existingOTP = await OTP.findOne({
  email,
});

if (existingOTP) {
  const now = Date.now();

  const otpCreatedTime = new Date(
    (existingOTP.updatedAt ||
      existingOTP.createdAt) as Date
  ).getTime();

  const diffInSeconds = Math.floor(
    (now - otpCreatedTime) / 1000
  );

  // BLOCK OTP REGENERATION FOR 30 SECONDS
  if (diffInSeconds < 30) {
    res.status(429).json({
      status: "error",
      message:
        "Please wait before requesting another OTP",

      retryAfter:
        30 - diffInSeconds,
    });

    return;
  }
}

// ---------------- GENERATE OTP ----------------
const generatedOTP = Math.floor(
  100000 + Math.random() * 900000
).toString();
    // ---------------- GENERATE VERIFICATION ID ----------------
    const verificationId =
      crypto.randomBytes(16).toString("hex");

    // ---------------- SAVE / UPDATE OTP ----------------
    await OTP.findOneAndUpdate(
      {
        email,
      },
      {
        email,
        mobile,

        verificationId,
        otp: generatedOTP,

        expiresAt: new Date(
          Date.now() + 5 * 60 * 1000
        ),
      },
      {
        upsert: true,
        new: true,
      }
    );


const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

let normalizedNumber = mobile.trim();
    if (!normalizedNumber.startsWith("+")) {
      // If no +, assume it's missing country code
      // For India: prepend +91
      normalizedNumber = "+91" + normalizedNumber.replace(/\D/g, "");
    }


   const message = await twilioClient.messages.create({
      body: `Your OTP is: ${generatedOTP}. Valid for 10 minutes. Do not share with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
      to: normalizedNumber, // Recipient number
    });


    // ---------------- TODO ----------------
    // SEND OTP USING EMAIL / SMS SERVICE

    // ---------------- RESPONSE ----------------
    res.status(isNewUser ? 201 : 200).json({
      status: "success",

      message: isNewUser
        ? "User registered and OTP generated successfully"
        : "OTP generated successfully",

      data: {
        userId: user._id,

        verificationId,

        // ...(process.env.NODE_ENV ===
        //   "development" && {
          otp: generatedOTP,
        // }),
      },
    });
  } catch (error: any) {
    console.error(
      "REGISTER CONTROLLER ERROR:",
      error
    );

    // ---------------- HANDLE DUPLICATE KEY ERROR ----------------
    if (error.code === 11000) {
      res.status(409).json({
        status: "error",
        message:
          "User already exists with provided email or mobile",
      });

      return;
    }

    // ---------------- INTERNAL SERVER ERROR ----------------
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};