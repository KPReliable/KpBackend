import { User } from "../../models/Users.model";
import { Request, Response } from "express";
import {registerUser} from "../../controllers/register/register.controller";
import bcrypt from "bcryptjs";

export const loginUser = async(req:Request,res:Response)=>{
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({status:"error",message:"Please provide email and password"})
    }
    const user=await User.findOne({email});
    if(!user){
        return res.status(404).json({status:"error",message:"User not found"})
    }
    const isPasswordValid=await bcrypt.compare(password,user.password);
    console.log(isPasswordValid);
    if(!isPasswordValid){
        return res.status(401).json({status:"error",message:"Invalid password"})
    }
    res.status(200).json({status:"success",message:"User logged in successfully",data:user})

}