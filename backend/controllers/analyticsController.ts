import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import CatchAsyncError from "../middleware/catchAsyncError";
import generateLast12MonthsData from "../utils/analyticsGenerator";
import User from "../models/userModel";
import Course from "../models/courseModel";
import Order from "../models/orderModel";

// get users analytics --- only for admin
const getUsersAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await generateLast12MonthsData(User);
        res.status(200).json({
            success: true,
            users,
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
},
);

// get courses analytics -- only for admin
const getCoursesAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courses = await generateLast12MonthsData(Course);
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// get orders analytics -- only for admin
const getOrdersAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const orders = await generateLast12MonthsData(Order);
    res.status(201).json({
        success: true,
        orders
    });
});

export default { getUsersAnalytics, getCoursesAnalytics, getOrdersAnalytics };