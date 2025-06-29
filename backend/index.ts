import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';
import errors from './middleware/error';
import userRoutes from './routes/userRoutes';
import courseRoutes from "./routes/courseRoutes";
import orderRoutes from "./routes/orderRoutes";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();
const app = express();

connectDB();
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME!,
    api_key: process.env.CLOUD_API_KEY!,
    api_secret: process.env.CLOUD_SECRET_KEY!,
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(errors);

// routes
app.use("/api/v1", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/order", orderRoutes);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "API is Working"
    });
})

app.use((req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} Not Found`) as any;
    err.statusCode = 404;
    next(err);
});

app.listen(process.env.port, () => {
    console.log(`server running on port ${process.env.port}`);
})