import mongoose from "mongoose";

let isConnected = false;

const connectDb = async () => {
  if (isConnected) {
    return;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI missing");
  }

  try {
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
    });

    isConnected = db.connections[0].readyState === 1;

    console.log("MongoDB Connected");
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export default connectDb;