// File: src/utils/twilio.ts

import twilio from "twilio";

/**
 * Initialize Twilio Client
 */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Generate OTP (6 digits by default)
 */
export const generateOTP = (length: number = 6): string => {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  return otp;
};

/**
 * Send OTP via SMS using Twilio
 * 
 * @param phoneNumber - Recipient phone number (with country code)
 * @param otp - OTP code to send
 * @returns Promise with message SID if successful
 */
export const sendOTPViaSMS = async (
  phoneNumber: string,
  otp: string
): Promise<string | null> => {
  try {
    console.log(`[TWILIO] Sending OTP to: ${phoneNumber}`);

    // Normalize phone number
    // Ensure it has + prefix and country code
    let normalizedNumber = phoneNumber.trim();
    if (!normalizedNumber.startsWith("+")) {
      // If no +, assume it's missing country code
      // For India: prepend +91
      normalizedNumber = "+91" + normalizedNumber.replace(/\D/g, "");
    }

    console.log(`[TWILIO] Normalized number: ${normalizedNumber}`);

    // Create SMS message
    const message = await twilioClient.messages.create({
      body: `Your OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
      to: normalizedNumber, // Recipient number
    });

    console.log(`[TWILIO] SMS sent successfully. SID: ${message.sid}`);

    return message.sid; // Return message SID on success

  } catch (error) {
    console.error("[TWILIO] Error sending SMS:", error);

    if (error instanceof Error) {
      console.error("[TWILIO] Error message:", error.message);
    }

    return null; // Return null on failure
  }
};

/**
 * Send SMS with custom message
 */
export const sendCustomSMS = async (
  phoneNumber: string,
  message: string
): Promise<string | null> => {
  try {
    console.log(`[TWILIO] Sending custom SMS to: ${phoneNumber}`);

    let normalizedNumber = phoneNumber.trim();
    if (!normalizedNumber.startsWith("+")) {
      normalizedNumber = "+91" + normalizedNumber.replace(/\D/g, "");
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedNumber,
    });

    console.log(`[TWILIO] Custom SMS sent. SID: ${result.sid}`);
    return result.sid;

  } catch (error) {
    console.error("[TWILIO] Error sending custom SMS:", error);
    return null;
  }
};

/**
 * Check SMS status by message SID
 */
export const checkSMSStatus = async (
  messageSid: string
): Promise<string | null> => {
  try {
    const message = await twilioClient.messages(messageSid).fetch();
    return message.status; // 'sent', 'delivered', 'failed', etc.

  } catch (error) {
    console.error("[TWILIO] Error checking SMS status:", error);
    return null;
  }
};

export default twilioClient;