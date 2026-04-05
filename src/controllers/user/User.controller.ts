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

export const UserFaq = async (req: Request, res: Response) => {
  try {
    
    const existing = await Faq.countDocuments();
    if (existing > 0) {
      return res.status(400).json({
        status: "error",
        message: `FAQs already seeded (${existing} records exist)`,
      });
    }


    const insertedFaq = await Faq.insertMany(faq);

    return res.status(201).json({
      status: "success",
      message: `${insertedFaq.length} FAQs inserted successfully`,
      data: insertedFaq,
    });

  } catch (error) {
    console.error("Seed FAQ error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};




export const UsergettingFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const faqs = await Faq.find()
      .select("question answer -_id")
      .lean()                          
      .sort({ createdAt: 1 });       

    if (!faqs || faqs.length === 0) {
      res.status(404).json({
        status: "error",
        message: "No FAQs found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "FAQs retrieved successfully",
      count: faqs.length,             
      data: faqs,
    });

  } catch (error) {
    console.error("Get FAQs error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};