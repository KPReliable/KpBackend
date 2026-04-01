// models/Faq.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IFaq extends Document {
  question: string;
  answer: string;
}

const FaqSchema = new Schema<IFaq>(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    collection: "faqs", // explicit collection name
  }
);

const Faq = mongoose.model<IFaq>("Faq", FaqSchema);
export default Faq;