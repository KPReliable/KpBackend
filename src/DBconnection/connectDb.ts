import mongoose from "mongoose";

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;

  console.log("DEBUG MONGO URI:", uri); // 👈 ADD THIS

  if (!uri) {
    throw new Error("❌ MONGODB_URI is NOT defined");
  }

  await mongoose.connect(uri);
};

export default connectDb;