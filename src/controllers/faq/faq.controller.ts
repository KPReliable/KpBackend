import Faq from "../../models/faq.model";
import { Request, Response } from "express";
import faq from "../../Data/faq.json";

export const UserFaq = async (req: Request, res: Response) => {
  try {
    
    const existing = await Faq.countDocuments();
    if (existing > 0) {
      return res.status(400).json({
        status: "error",
        message: `FAQs already seeded (${existing} records exist)`,
      });
    }


    const insertedFaq = await Faq.insertMany(faq);

    return res.status(201).json({
      status: "success",
      message: `${insertedFaq.length} FAQs inserted successfully`,
      data: insertedFaq,
    });

  } catch (error) {
    console.error("Seed FAQ error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};


export const UsergettingFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const faqs = await Faq.find()
      .select("question answer -_id")
      .lean()                          
      .sort({ createdAt: 1 });       

    if (!faqs || faqs.length === 0) {
      res.status(404).json({
        status: "error",
        message: "No FAQs found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "FAQs retrieved successfully",
      count: faqs.length,             
      data: faqs,
    });

  } catch (error) {
    console.error("Get FAQs error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};