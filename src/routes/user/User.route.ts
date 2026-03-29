import express from "express";
import { userTest,registerUser,loginUser } from "../../controllers/user/User.controller";

const router = express.Router();

router.get("/user", userTest);
router.post("/register",registerUser);
router.post("/login",loginUser);
export default router