import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IBookedSlot
  extends Document {
  userId: mongoose.Types.ObjectId;

  name: string;

  email: string;

  mobile: string;

  countryCode?: string;

  organization?: string;

  slot_time: Date;

  slot_date: string;

  slot_time_display: string;

  is_booked: boolean;

  booked_at?: Date;

  created_at?: Date;

  updated_at?: Date;
}

const bookedSlotSchema =
  new Schema<IBookedSlot>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      mobile: {
        type: String,
        required: true,
        trim: true,
      },

      countryCode: {
        type: String,
        trim: true,
      },

      organization: {
        type: String,
        trim: true,
      },

      // FULL DATETIME OBJECT
      slot_time: {
        type: Date,
        required: true,
        unique: true,
      },

      // DISPLAY DATE
      slot_date: {
        type: String,
        required: true,
        trim: true,
      },

      // DISPLAY TIME
      slot_time_display: {
        type: String,
        required: true,
        trim: true,
      },

      is_booked: {
        type: Boolean,
        default: true,
      },

      booked_at: {
        type: Date,
        default: Date.now,
      },

      created_at: {
        type: Date,
        default: Date.now,
      },

      updated_at: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: false,
    }
  );

// INDEXES
bookedSlotSchema.index({
  email: 1,
  mobile: 1,
});

bookedSlotSchema.index({
  slot_time: 1,
});

export const BookedSlot: Model<IBookedSlot> =
  mongoose.models.BookedSlot ||
  mongoose.model<IBookedSlot>(
    "BookedSlot",
    bookedSlotSchema
  );

export default BookedSlot;