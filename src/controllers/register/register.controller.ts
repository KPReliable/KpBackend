import { Request, Response } from "express";
import crypto from "crypto";
import twilio from "twilio";

import { User } from "../../models/Users.model";
import { OTP } from "../../models/OTP.model";
import connectDb from "../../DBconnection/connectDb";

// ============================================================
// ✅ FIXED REGISTRATION CONTROLLER WITH TWILIO SMS
// ============================================================

/**
 * Register user and send OTP via SMS
 * 
 * Request body:
 * {
 *   name: string,
 *   orgName: string,
 *   email: string,
 *   mobile: string (10 digits without country code),
 *   countryCode: string (+91 for India, etc)
 * }
 */

export const registerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // ============================================================
    // STEP 1: DATABASE CONNECTION
    // ============================================================
    
    await connectDb(); // Ensure connection before operations

    let {
      name,
      orgName,
      email,
      mobile,
      countryCode,
    } = req.body;

    // ============================================================
    // STEP 2: SANITIZE INPUTS
    // ============================================================
    
    name = name?.trim();
    orgName = orgName?.trim();
    email = email?.trim().toLowerCase();
    mobile = mobile?.trim();
    countryCode = countryCode?.trim();

    console.log(
      "[REGISTER] Received request for:",
      { name, email, mobile, countryCode }
    );

    // ============================================================
    // STEP 3: REQUIRED FIELD VALIDATION
    // ============================================================
    
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
        code: "MISSING_FIELDS",
      });
      return;
    }

    // ============================================================
    // STEP 4: NAME VALIDATION
    // ============================================================
    
    const nameRegex = /^[A-Za-z\s]{2,50}$/;

    if (!nameRegex.test(name)) {
      res.status(400).json({
        status: "error",
        message:
          "Name must contain only letters and spaces (2-50 characters)",
        code: "INVALID_NAME",
      });
      return;
    }

    // ============================================================
    // STEP 5: ORGANIZATION NAME VALIDATION
    // ============================================================
    
    const orgNameRegex =
      /^[A-Za-z0-9\s&.,'-]{2,100}$/;

    if (!orgNameRegex.test(orgName)) {
      res.status(400).json({
        status: "error",
        message:
          "Invalid organization name (2-100 characters, alphanumeric)",
        code: "INVALID_ORG_NAME",
      });
      return;
    }

    // ============================================================
    // STEP 6: EMAIL VALIDATION
    // ============================================================
    
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      res.status(400).json({
        status: "error",
        message: "Invalid email format",
        code: "INVALID_EMAIL",
      });
      return;
    }

    // ============================================================
    // STEP 7: MOBILE VALIDATION
    // ============================================================
    
    const mobileRegex = /^[0-9]{10}$/;

    if (!mobileRegex.test(mobile)) {
      res.status(400).json({
        status: "error",
        message:
          "Mobile number must be 10 digits (without country code)",
        code: "INVALID_MOBILE",
      });
      return;
    }

    // ============================================================
    // STEP 8: COUNTRY CODE VALIDATION
    // ============================================================
    
    const countryCodeRegex = /^\+\d{1,4}$/;

    if (!countryCodeRegex.test(countryCode)) {
      res.status(400).json({
        status: "error",
        message:
          "Invalid country code format (e.g., +91 for India)",
        code: "INVALID_COUNTRY_CODE",
      });
      return;
    }

    // ============================================================
    // STEP 9: CHECK IF EMAIL ALREADY EXISTS
    // ============================================================
    
    console.log("[REGISTER] Checking if email exists:", email);

    const existingEmailUser =
      await User.findOne({ email });

    if (
      existingEmailUser &&
      existingEmailUser.mobile !== mobile
    ) {
      // Same email, different mobile = conflict
      console.warn(
        "[REGISTER] Email conflict:",
        email,
        "linked to",
        existingEmailUser.mobile
      );

      res.status(409).json({
        status: "error",
        message:
          "Email already linked with another account",
        code: "EMAIL_CONFLICT",
      });
      return;
    }

    // ============================================================
    // STEP 10: CHECK IF MOBILE ALREADY EXISTS
    // ============================================================
    
    console.log("[REGISTER] Checking if mobile exists:", mobile);

    const existingMobileUser =
      await User.findOne({ mobile });

    if (
      existingMobileUser &&
      existingMobileUser.email !== email
    ) {
      // Same mobile, different email = conflict
      console.warn(
        "[REGISTER] Mobile conflict:",
        mobile,
        "linked to",
        existingMobileUser.email
      );

      res.status(409).json({
        status: "error",
        message:
          "Mobile already linked with another account",
        code: "MOBILE_CONFLICT",
      });
      return;
    }

    // ============================================================
    // STEP 11: CHECK IF BOOKED (ALREADY COMPLETED)
    // ============================================================
    
    if (existingEmailUser?.booked === true) {
      console.warn(
        "[REGISTER] User already booked:",
        email
      );

      res.status(403).json({
        status: "error",
        message:
          "You have already completed your booking",
        code: "ALREADY_BOOKED",
      });
      return;
    }

    // ============================================================
    // STEP 12: CREATE OR UPDATE USER
    // ============================================================
    
    console.log("[REGISTER] Creating/updating user:", email);

    let user = await User.findOne({ email });
    const isNewUser = !user;

    if(!user)
    {
      return
    }

    if (isNewUser) {
      // Create new user
      user = await User.create({
        name,
        orgName,
        email,
        mobile,
        countryCode,
        isVerified: false,
        booked: false,
      });

      console.log("[REGISTER] User created:", user._id);
    } else {
      // Update existing user (if not booked)
        user = await User.findByIdAndUpdate(
        user._id,
        {
          name,
          orgName,
          mobile,
          countryCode,
          isVerified: false,
        },
        { new: true }
      );

       if(!user)
    {
      return
    }
      console.log("[REGISTER] User updated:", user._id);
    }

    // ============================================================
    // STEP 13: CHECK OTP COOLDOWN (30 SECONDS)
    // ============================================================
    
    console.log("[REGISTER] Checking OTP cooldown for:", email);

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
        console.warn(
          "[REGISTER] OTP cooldown active:",
          email
        );

        res.status(429).json({
          status: "error",
          message:
            "Please wait before requesting another OTP",
          code: "OTP_COOLDOWN",
          retryAfter: 30 - diffInSeconds,
        });
        return;
      }
    }

    // ============================================================
    // STEP 14: GENERATE OTP (6 DIGITS)
    // ============================================================
    
    const generatedOTP = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log("[REGISTER] Generated OTP:", generatedOTP);

    // ============================================================
    // STEP 15: GENERATE VERIFICATION ID
    // ============================================================
    
    const verificationId =
      crypto.randomBytes(16).toString("hex");

    console.log(
      "[REGISTER] Generated verification ID:",
      verificationId
    );

    // ============================================================
    // STEP 16: SAVE/UPDATE OTP IN DATABASE
    // ============================================================
    
    console.log("[REGISTER] Saving OTP to database:", email);

    const otpRecord = await OTP.findOneAndUpdate(
      { email },
      {
        email,
        mobile,
        countryCode,
        verificationId,
        otp: generatedOTP,
        expiresAt: new Date(
          Date.now() + 5 * 60 * 1000 // 5 minutes
        ),
      },
      {
        upsert: true,
        new: true,
      }
    );

    console.log("[REGISTER] OTP saved:", otpRecord._id);

    // ============================================================
    // STEP 17: ✅ INITIALIZE TWILIO CLIENT
    // ============================================================
    
    console.log("[REGISTER] Initializing Twilio client");

    // Check environment variables
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.error("[REGISTER] Missing Twilio credentials");

      res.status(500).json({
        status: "error",
        message: "SMS service not configured",
        code: "SMS_CONFIG_ERROR",
      });
      return;
    }

    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // ============================================================
    // STEP 18: ✅ NORMALIZE PHONE NUMBER TO E.164 FORMAT
    // ============================================================
    
    console.log(
      "[REGISTER] Normalizing phone number:",
      mobile
    );

    // Construct full phone number: countryCode + mobile
    // Example: +91 + 9876543210 = +919876543210
    const fullPhoneNumber = `${countryCode}${mobile}`;

    console.log(
      "[REGISTER] Full phone number:",
      fullPhoneNumber
    );

    // ============================================================
    // STEP 19: ✅ SEND OTP VIA SMS USING TWILIO
    // ============================================================
    
    console.log(
      "[REGISTER] Sending SMS to:",
      fullPhoneNumber
    );

    try {
      const smsResponse = await twilioClient.messages.create({
        body: `Your OTP is: ${generatedOTP}. Valid for 5 minutes. Do not share with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: fullPhoneNumber,
      });

      console.log(
        "[REGISTER] SMS sent successfully:",
        smsResponse.sid
      );

      // ============================================================
      // STEP 20: ✅ UPDATE OTP WITH MESSAGE SID
      // ============================================================
      
      await OTP.findByIdAndUpdate(
        otpRecord._id,
        {
          smsSid: smsResponse.sid,
          smsStatus: "sent",
        }
      );

      console.log(
        "[REGISTER] OTP record updated with SMS SID"
      );

    } catch (twilioError: any) {
      console.error(
        "[REGISTER] Twilio SMS Error:",
        twilioError.message
      );

      // If Twilio fails, we still want to return success for OTP
      // (in case it's a temporary Twilio issue)
      // But log it for monitoring
      
      if (
        twilioError.message &&
        twilioError.message.includes("unverified")
      ) {
        // User phone number not verified in Twilio (free trial)
        res.status(500).json({
          status: "error",
          message:
            "Phone number not verified in SMS service. Please verify your number in Twilio console.",
          code: "PHONE_NOT_VERIFIED",
          error: twilioError.message,
        });
        return;
      }

      if (
        twilioError.message &&
        twilioError.message.includes("invalid")
      ) {
        // Invalid phone number format
        res.status(400).json({
          status: "error",
          message: "Invalid phone number format",
          code: "INVALID_PHONE_FORMAT",
          error: twilioError.message,
        });
        return;
      }

      // Other Twilio error
      res.status(500).json({
        status: "error",
        message: "Failed to send OTP via SMS",
        code: "SMS_SEND_ERROR",
        error:
          process.env.NODE_ENV === "development"
            ? twilioError.message
            : undefined,
      });
      return;
    }

    // ============================================================
    // STEP 21: ✅ SUCCESS RESPONSE
    // ============================================================
    
    console.log("[REGISTER] Registration successful:", email);

    res.status(isNewUser ? 201 : 200).json({
      status: "success",
      message: isNewUser
        ? "User registered and OTP sent successfully"
        : "OTP sent successfully",
      code: "REGISTRATION_SUCCESS",
      data: {
        userId: user._id,
        email: user.email,
        mobile: user.mobile,
        verificationId,
        expiresIn: "5 minutes",
        // ⚠️ DEVELOPMENT ONLY - Remove in production
        ...(process.env.NODE_ENV === "development" && {
          otp: generatedOTP,
        }),
      },
    });

  } catch (error: any) {
    console.error(
      "[REGISTER] ERROR:",
      error.message || error
    );

    // ============================================================
    // HANDLE DUPLICATE KEY ERROR (MongoDB)
    // ============================================================
    
    if (error.code === 11000) {
      console.warn("[REGISTER] Duplicate key error:", error.keyValue);

      res.status(409).json({
        status: "error",
        message:
          "User already exists with provided email or mobile",
        code: "DUPLICATE_USER",
      });
      return;
    }

    // ============================================================
    // HANDLE VALIDATION ERROR
    // ============================================================
    
    if (error.name === "ValidationError") {
      console.warn("[REGISTER] Validation error:", error.message);

      res.status(400).json({
        status: "error",
        message: error.message,
        code: "VALIDATION_ERROR",
      });
      return;
    }

    // ============================================================
    // HANDLE DATABASE CONNECTION ERROR
    // ============================================================
    
    if (error.message?.includes("connect")) {
      console.error("[REGISTER] Database connection error");

      res.status(503).json({
        status: "error",
        message: "Database connection error",
        code: "DB_CONNECTION_ERROR",
      });
      return;
    }

    // ============================================================
    // INTERNAL SERVER ERROR
    // ============================================================
    
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      code: "INTERNAL_ERROR",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

export default registerController;