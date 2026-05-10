import express from "express";

import { contactUs } from "../../controllers/contact-us/contactUs.controller";

import { ContactUs } from "../../constants/Routes.constant";

// import {UserFaq,UsergettingFaq} from "../../controllers/faq/faq.controller";

const router = express.Router();

router.post(ContactUs.Contact,contactUs)



export default router;