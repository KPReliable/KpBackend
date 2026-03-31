import express from "express";
import {UserRegister,UserLogin,ComapnyFaqs,ComapnyGettingFaqs} from "../../constants/Routes.constant";
import { userTest,registerUser,loginUser,UserFaq,UsergettingFaq } from "../../controllers/user/User.controller";

const router = express.Router();

router.get("/user", userTest);
router.post(UserRegister,registerUser);
router.post(UserLogin,loginUser);
router.post(ComapnyFaqs,UserFaq);
router.get(ComapnyGettingFaqs,UsergettingFaq);

export default router