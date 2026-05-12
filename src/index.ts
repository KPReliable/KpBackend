import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDb from "./DBconnection/connectDb";

// Await connection before exporting (for serverless)
const initializeApp = async () => {
  try {
    await connectDb();
    console.log("Database connected, app ready");
    return app;
  } catch (err) {
    console.error("Failed to initialize app:", err);
    process.exit(1);  // Or handle gracefully
  }
};

export default initializeApp().catch((err) => {
  console.error(err);
  return null;  // Fallback
});