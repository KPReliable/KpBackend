import mongoose from "mongoose";

const connectDb = async () => {
  if (mongoose.connection.readyState >= 1) {  // 1 = connected, 2 = connecting
    return;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI missing");
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      bufferCommands: false,  // Disable buffering to fail fast
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};

export default connectDb;