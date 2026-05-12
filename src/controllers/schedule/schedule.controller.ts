// File: src/routes/public/booking.ts
// ✅ IMPROVED: Book slot API that fits frontend model

import { Response, Request } from "express";
import {User} from "../../models/Users.model";
import {BookedSlot} from "../../models/BookedSlot.model";

/**
 * ============================================================
 * GET AVAILABLE DATES AND TIMES
 * ============================================================
 * 
 * Fetches available booking slots from database
 * Called before user selects date/time
 */

export const getAvailableSlots = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, mobile } = req.query;

    // Validate inputs
    if (!email || !mobile) {
      res.status(400).json({
        status: "error",
        message: "Email and mobile are required",
        code: "MISSING_FIELDS",
      });
      return;
    }

    const normalizedEmail = (email as string).toLowerCase().trim();
    const normalizedMobile = (mobile as string).trim();

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
      mobile: normalizedMobile,
    });

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
      return;
    }

    // Check if already booked
    if (user.booked === true) {
      res.status(403).json({
        status: "error",
        message: "You have already booked a slot",
        code: "ALREADY_BOOKED",
        data: {
          booked_at: user.booked,
        },
      });
      return;
    }

    // Generate available dates (next 7 days, excluding weekends)
    const availableDates = generateAvailableDates();

    // Generate time slots (business hours: 10 AM - 6 PM, 1 hour intervals)
    const availableTimes = generateAvailableTimeSlots();

    // Get already booked slots to show as unavailable
    const bookedSlots = await BookedSlot.find({
      is_booked: true,
    }).select("slot_time");

    const bookedSlotTimes = bookedSlots.map((slot) =>
      slot.slot_time.toISOString()
    );

    console.log(`[GET SLOTS] Fetched slots for user: ${normalizedEmail}`);

    res.status(200).json({
      status: "success",
      message: "Available slots fetched successfully",
      code: "SLOTS_FETCHED",
      data: {
        userId: user._id,
        dates: availableDates,
        timeSlots: availableTimes,
        bookedSlots: bookedSlotTimes,
      },
    });
  } catch (error) {
    console.error("[GET SLOTS] Error:", error);

    res.status(500).json({
      status: "error",
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * ============================================================
 * BOOK SLOT
 * ============================================================
 * 
 * Confirms booking with selected date and time
 * Updates user booked status to true
 */

export const bookSlot = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      userId,
      email,
      mobile,
      countryCode,
      name,
      orgName,
      selectedDate,
      selectedTime,
    } = req.body;

    // ============================================================
    // STEP 1: VALIDATE INPUTS
    // ============================================================

    if (
      !userId ||
      !email ||
      !mobile ||
      !selectedDate ||
      !selectedTime
    ) {
      res.status(400).json({
        status: "error",
        message: "All booking details are required",
        code: "MISSING_FIELDS",

        required: [
          "userId",
          "email",
          "mobile",
          "selectedDate",
          "selectedTime",
        ],
      });

      return;
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const normalizedMobile =
      mobile.trim();

    console.log(
      `[BOOK SLOT] Booking request for: ${normalizedEmail}, Date: ${selectedDate}, Time: ${selectedTime}`
    );

    // ============================================================
    // STEP 2: FIND USER
    // ============================================================

    const user = await User.findById(
      userId
    );

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
        code: "USER_NOT_FOUND",
      });

      return;
    }

    // VERIFY USER DETAILS
    if (
      user.email !== normalizedEmail ||
      user.mobile !== normalizedMobile
    ) {
      res.status(400).json({
        status: "error",
        message:
          "Email or mobile does not match user record",

        code: "DATA_MISMATCH",
      });

      return;
    }

    // ============================================================
    // STEP 3: CHECK IF ALREADY BOOKED
    // ============================================================

    if (user.booked === true) {
      const existingBookedSlot =
        await BookedSlot.findOne({
          userId: user._id,
          is_booked: true,
        });

      res.status(403).json({
        status: "error",
        message:
          "You have already booked a slot",

        code: "ALREADY_BOOKED",

        data: existingBookedSlot
          ? {
              bookingId:
                existingBookedSlot._id,

              slotDate:
                existingBookedSlot.slot_date,

              slotTime:
                existingBookedSlot.slot_time_display,

              booked_at:
                existingBookedSlot.booked_at,
            }
          : undefined,
      });

      return;
    }

    // ============================================================
    // STEP 4: VALIDATE DATE & TIME
    // ============================================================

    const slotDateTime =
      parseSlotDateTime(
        selectedDate,
        selectedTime
      );

    if (
      !slotDateTime ||
      slotDateTime instanceof Error
    ) {
      res.status(400).json({
        status: "error",
        message:
          "Invalid date or time format",

        code: "INVALID_DATETIME",
      });

      return;
    }

    // WEEKDAY VALIDATION
    const dayOfWeek =
      slotDateTime.getDay();

    if (
      ![1, 2, 3, 4, 5].includes(
        dayOfWeek
      )
    ) {
      res.status(400).json({
        status: "error",

        message:
          "Booking only available on weekdays (Monday to Friday)",

        code: "INVALID_DAY",

        selectedDay:
          getDayName(dayOfWeek),
      });

      return;
    }

    // BUSINESS HOURS VALIDATION
    const hour =
      slotDateTime.getHours();

    if (hour < 10 || hour >= 18) {
      res.status(400).json({
        status: "error",

        message:
          "Booking only available between 10 AM and 6 PM",

        code: "INVALID_TIME",

        selectedHour: `${hour}:00`,
      });

      return;
    }

    // ============================================================
    // STEP 5: CHECK SLOT AVAILABILITY
    // ============================================================

    const existingBooking =
      await BookedSlot.findOne({
        slot_time: slotDateTime,
        is_booked: true,
      });

    if (existingBooking) {
      res.status(409).json({
        status: "error",

        message:
          "This slot is already booked by another user",

        code: "SLOT_UNAVAILABLE",

        attemptedSlot:
          slotDateTime.toISOString(),
      });

      return;
    }

    // ============================================================
    // STEP 6: CREATE BOOKING RECORD
    // ============================================================

    console.log(
      `[BOOK SLOT] Creating booking for: ${normalizedEmail}`
    );

    const bookedSlot =
      await BookedSlot.create({
        userId: user._id,

        name,

        email: normalizedEmail,

        mobile: normalizedMobile,

        countryCode,

        organization: orgName,

        slot_time: slotDateTime,

        slot_date: selectedDate,

        slot_time_display:
          selectedTime,

        is_booked: true,

        booked_at: new Date(),

        created_at: new Date(),

        updated_at: new Date(),
      });

    // ============================================================
    // STEP 7: UPDATE USER BOOKED STATUS
    // ============================================================

    console.log(
      `[BOOK SLOT] Updating user booked status: ${userId}`
    );

    const updatedUser =
      await User.findByIdAndUpdate(
        userId,
        {
          booked: true,
        },
        { new: true }
      );

    if (!updatedUser) {
      throw new Error(
        "Failed to update user booking status"
      );
    }

    // ============================================================
    // STEP 8: SUCCESS RESPONSE
    // ============================================================

    console.log(
      `[BOOK SLOT] Booking successful for: ${normalizedEmail}`
    );

    res.status(201).json({
      status: "success",

      message:
        "Slot booked successfully",

      code: "BOOKING_SUCCESS",

      data: {
        bookingId: bookedSlot._id,

        userId: updatedUser._id,

        email: updatedUser.email,

        name: updatedUser.name,

        organization:
          updatedUser.orgName,

        slotDate:
          bookedSlot.slot_date,

        slotTime:
          bookedSlot.slot_time_display,

        slotDateTime:
          bookedSlot.slot_time.toISOString(),

        booked_at:
          bookedSlot.booked_at,

        confirmationSent: true,
      },
    });
  } catch (error) {
    console.error(
      "[BOOK SLOT] Error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error";

    res.status(500).json({
      status: "error",

      message:
        "Internal server error during booking",

      code: "INTERNAL_ERROR",

      error:
        process.env.NODE_ENV ===
        "development"
          ? errorMessage
          : undefined,
    });
  }
};
/**
 * ============================================================
 * GET USER BOOKING
 * ============================================================
 * 
 * Retrieves user's booked slot information
 */

export const getUserBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, email } = req.query;

    if (!userId || !email) {
      res.status(400).json({
        status: "error",
        message: "userId and email are required",
        code: "MISSING_FIELDS",
      });
      return;
    }

    const normalizedEmail = (email as string).toLowerCase().trim();

    // Find booking
    const booking = await BookedSlot.findOne({
      userId,
      email: normalizedEmail,
      is_booked: true,
    });

    if (!booking) {
      res.status(404).json({
        status: "error",
        message: "No booking found for this user",
        code: "BOOKING_NOT_FOUND",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Booking retrieved successfully",
      code: "BOOKING_FOUND",
      data: {
        bookingId: booking._id,
        userId: booking.userId,
        email: booking.email,
        name: booking.name,
        organization: booking.organization,
        slotDate: booking.slot_date,
        slotTime: booking.slot_time_display,
        slotDateTime: booking.slot_time.toISOString(),
        booked_at: booking.booked_at,
      },
    });
  } catch (error) {
    console.error("[GET BOOKING] Error:", error);

    res.status(500).json({
      status: "error",
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * ============================================================
 * HELPER FUNCTIONS
 * ============================================================
 */

/**
 * Generate available dates (next 7 days, excluding weekends)
 */
function generateAvailableDates(): Array<{
  day: string;
  date: string;
  month: string;
  available: boolean;
}> {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    const dayOfWeek = currentDate.getDay();
    // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;

    const dayName = getDayName(dayOfWeek);
    const dateNumber = String(currentDate.getDate()).padStart(2, "0");
    const monthName = getMonthName(currentDate.getMonth());

    dates.push({
      day: dayName,
      date: dateNumber,
      month: monthName,
      available: isWeekday,
    });
  }

  return dates;
}

/**
 * Generate available time slots (10 AM - 6 PM, 1 hour intervals)
 */
function generateAvailableTimeSlots(): string[] {
  const slots = [];

  for (let hour = 10; hour < 18; hour++) {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    slots.push(`${displayHour}:00 ${ampm}`);
  }

  return slots;
}

/**
 * Parse slot date and time into JavaScript Date object
 */
function parseSlotDateTime(
  dateString: string,
  timeString: string
): Date | Error {
  try {
    // dateString format: "Tue 14 Apr"
    // timeString format: "4:30 PM"

    const today = new Date();
    const currentYear = today.getFullYear();

    // Parse time
    const timeParts = timeString.match(/(\d+):(\d+)\s(AM|PM)/);
    if (!timeParts) {
      return new Error("Invalid time format");
    }

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3];

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    // Parse date
    const dateParts = dateString.split(" ");
    if (dateParts.length !== 3) {
      return new Error("Invalid date format");
    }

    const dayName = dateParts[0];
    const dateNumber = parseInt(dateParts[1]);
    const monthName = dateParts[2];

    // Get month number
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIndex = months.indexOf(monthName);

    if (monthIndex === -1) {
      return new Error("Invalid month");
    }

    // Create date
    const slotDate = new Date(currentYear, monthIndex, dateNumber);
    slotDate.setHours(hours, minutes, 0, 0);

    // Validate that the date is in the future
    if (slotDate < today) {
      return new Error("Slot date must be in the future");
    }

    return slotDate;
  } catch (error) {
    return new Error("Failed to parse slot date and time");
  }
}

/**
 * Get day name from day of week number
 */
function getDayName(dayOfWeek: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[dayOfWeek];
}

/**
 * Get month name from month index
 */
function getMonthName(monthIndex: number): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[monthIndex];
}

export default bookSlot;