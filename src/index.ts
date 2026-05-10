import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDb from "./DBconnection/connectDb";

// CONNECT DATABASE
connectDb()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error(
      "Failed to connect to MongoDB:",
      err
    );
  });

// EXPORT APP FOR VERCEL
export default app;