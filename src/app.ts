import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import appRoutes from "./routes";
import router from "./routes/user/User.route"
// import { swaggerSetup } from "./swagger";

const app: Application = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost',
  'https://kpbackend-production.up.railway.app',
  'https://kprt-website.vercel.app',
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies & auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-api-key",
    "x-api-secret",
    "x-forwarded-for",
    "x-kb-authorization",
    "x-kb-domain"
  ],
}));

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// swaggerSetup(app);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "KpReliable backend is running" });
});

// app.use("/api/v1", appRoutes);
app.use("/api/v1", router)
appRoutes(app);

app.use((req: Request, res: Response) => {
  res.status(404).json({ status: "error", message: "Endpoint not found" });
});

export default app;
