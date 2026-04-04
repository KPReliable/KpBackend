import express from "express";
import {UserRegister,UserLogin,ComapnyFaqs,ComapnyGettingFaqs} from "../../constants/Routes.constant";
import { userTest } from "../../controllers/user/User.controller";
import { registerUser } from "../../controllers/register/register.controller";
import { loginUser } from "../../controllers/login/login.controller";
import {contactUs} from "../../controllers/contact-us/contactUs.controller";
import { contact } from "../../constants/Routes.constant";
import {UserFaq,UsergettingFaq} from "../../controllers/faq/faq.controller";
const router = express.Router();

router.get("/user", userTest);
router.post(UserRegister,registerUser);
router.post(UserLogin,loginUser);
router.post(ComapnyFaqs,UserFaq);
router.get(ComapnyGettingFaqs,UsergettingFaq);
router.post(contact,contactUs);


export default router;