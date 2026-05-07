import express from "express";
import {UserRegister,VerifyOtp} from "../../constants/Routes.constant";
// import { userTest } from "../../controllers/user/User.controller";
import { registerController } from "../../controllers/register/register.controller";
import { verifyOTPController } from "../../controllers/verify-otp/verify-otp.controller";

// import {UserFaq,UsergettingFaq} from "../../controllers/faq/faq.controller";

const router = express.Router();

router.post(UserRegister,registerController);
router.post(VerifyOtp,verifyOTPController)



export default router;