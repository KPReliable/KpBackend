import { User } from "../../models/Users.model";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";

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
