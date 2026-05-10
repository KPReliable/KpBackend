import express from "express";
// import { userTest } from "../../controllers/user/User.controller";
import { registerController } from "../../controllers/register/register.controller";
import { verifyOTPController } from "../../controllers/verify-otp/verify-otp.controller";
import { UserRoutes } from "../../constants/Routes.constant";

// import {UserFaq,UsergettingFaq} from "../../controllers/faq/faq.controller";

const router = express.Router();

router.post(UserRoutes.UserRegister,registerController);
router.post(UserRoutes.VerifyOtp,verifyOTPController)



export default router;