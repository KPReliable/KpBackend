import express from "express";
// import { userTest } from "../../controllers/user/User.controller";
// import { registerController } from "../../controllers/register/register.controller";
import { getAvailableSlots } from "../../controllers/schedule/schedule.controller";
// import { verifyOTPController } from "../../controllers/verify-otp/verify-otp.controller";
import { Schedule } from "../../constants/Routes.constant";

// import {UserFaq,UsergettingFaq} from "../../controllers/faq/faq.controller";

const router = express.Router();

router.post(Schedule.schedule,getAvailableSlots);



export default router;