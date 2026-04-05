import { Request,Response } from "express";
import { User } from "../../models/Users.model";
import Faq from "../../models/faq.model";
import bcrypt from "bcryptjs";
import faq from "../../Data/faq.json";
export const userTest = async(req:Request,res:Response)=>{

 res.status(200).json({ status: "ok", message: " user is running" });
console.log("Api is working");

}
export const registerUser = async(req:Request,res:Response)=>{
    const {name,email,password}=req.body;
    if(!name || !email || !password){
        return res.status(400).json({status:"error",message:"Please provide name,email and password"})
    }
    const hashedPassword=await bcrypt.hash(password,10);
    const createdUser=await User.create({name,email,password:hashedPassword});

    if(!createdUser){
       return res.status(500).json({status:"error",message:"Error creating user"})
    }
    
    res.status(201).json({status:"success",message:"User registered successfully"})
}
// export const loginUser = async(req:Request,res:Response)=>{
//     const {email,password}=req.body;
//     if(!email || !password){
//         return res.status(400).json({status:"error",message:"Please provide email and password"})
//     }
//     const user=await User.findOne({email}).select("+password");
//     if(!user){
//         return res.status(404).json({status:"error",message:"User not found"})
//     }
//     const isPasswordValid = await bcrypt.compare(password, user.password as string);
//     console.log(isPasswordValid);
//     if(!isPasswordValid){
//         return res.status(401).json({status:"error",message:"Invalid password"})
//     }
//     res.status(200).json({status:"success",message:"User logged in successfully",data:user})
// }








