import { Request, Response } from "express";
import contactSchema from "../../models/contactus.model";
import sendmail from "../../email/automated.email";
import { buildConfirmationEmail } from "../../Data/emailTemplate";
// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactRequestBody {
  name: string;
  email: string;
  message: string;
  phonenumber: string;
  ServiceInterestedIn?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof ContactRequestBody)[] = [
  "name",
  "email",
  "message",
  "phonenumber",
];





const getMissingFields = (body: Partial<ContactRequestBody>): string[] =>
  REQUIRED_FIELDS.filter((field) => !body[field]);

const sendConfirmationEmail = (email: string, name: string): void => {
  sendmail(email, "Contact Us Submission Received", buildConfirmationEmail(name)).catch(
    (error: unknown) => {
      console.error("Failed to send confirmation email:", {
        recipient: email,
        error,
      });
    }
  );
};

// ─── Controller ───────────────────────────────────────────────────────────────

export const contactUs = async (req: Request, res: Response): Promise<void> => {
  const { name, email, message, phonenumber, ServiceInterestedIn } =
    req.body as ContactRequestBody;

  // Validate required fields
  const missingFields = getMissingFields({ name, email, message, phonenumber });
  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      error: "All fields are required",
      missing: missingFields,
    });
    return;
  }

  try {
    const savedContact = await contactSchema.create({
      name,
      email,
      message,
      phonenumber,
      ServiceInterestedIn,
    });

    res.status(201).json({
      success: true,
      data: savedContact,
    });

    // Fire-and-forget: send confirmation email after response
    sendConfirmationEmail(email, name);
  } catch (error: unknown) {
    console.error("Failed to save contact submission:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit contact information. Please try again later.",
    });
  }
};