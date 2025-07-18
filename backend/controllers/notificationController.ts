import { NextFunction, Request, Response } from "express";
import CatchAsyncError from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import Notification from "../models/notificationModel";
import cron from "node-cron";

// get all notifications--only admin
const getNotifications = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            notifications
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// update notification status
const updateNotification = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        if (!id) {
            return next(new ErrorHandler("Notification ID is required", 400));
        }
        const notification = await Notification.findByIdAndUpdate(id, { status: "read" }, { new: true });
        if (!notification) {
            return next(new ErrorHandler("Notification not found", 404));
        }
        await notification.save();
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notifications
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// delete notification -- only admin
cron.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await Notification.deleteMany({
        status: "read",
        createdAt: { $lt: thirtyDaysAgo },
    });
    console.log("Deleted read notifications");
});
export default { getNotifications, updateNotification };