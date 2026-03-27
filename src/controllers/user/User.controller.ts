import { Request,Response } from "express";

export const userTest = async(req:Request,res:Response)=>{

 res.status(200).json({ status: "ok", message: " user is running" });
console.log("Api is working");

}
