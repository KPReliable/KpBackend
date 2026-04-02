import dotenv from "dotenv";
dotenv.config();

import app from "./app";

import connectDb from "./DBconnection/connectDb";
const BASE_URL = process.env.BASE_URL;

const port = Number(process.env.PORT) || 8080;

const server = app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(`Port ${port} is already in use. Use another port or stop conflicting service.`);
    process.exit(1);
  }
  throw error;
});

connectDb().then(() => {
  // eslint-disable-next-line no-console
  console.log("Connected to MongoDB");
}).catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to connect to MongoDB:", err);

});