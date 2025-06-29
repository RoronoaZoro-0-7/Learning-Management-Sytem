    import { NextFunction, Request, Response } from "express";
    import CatchAsyncError from "../middleware/catchAsyncError";
    import ErrorHandler from "../utils/ErrorHandler";
    import Order, { IOrder } from "../models/orderModel";
    import Notification from "../models/notificationModel";
    import User from "../models/userModel";
    import Course from "../models/courseModel";
    import ejs, { name } from "ejs";
    import sendMail from "../utils/sendMail";
    import orderService from "../services/orderService";

    // Create a new order
    const createOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(new ErrorHandler("User not authenticated", 401));
            }
            const user = await User.findById(req.user._id);
            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }
            const { courseId, payment_info } = req.body;
            // if (!courseId || !payment_info) {
            //     return next(new ErrorHandler("Course ID and payment information are required", 400));
            // }
            const isExists = user.courses.some((course: any) => course.toString() === courseId);
            if (isExists) {
                return next(new ErrorHandler("You have already purchased this course", 400));
            }
            const course = await Course.findById(courseId);
            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }
            const data: any = {
                courseId: course._id,
                userId: user._id,
                payment_info,
            }
            const order: any = {
                _id: (course._id as string | number | { toString(): string }).toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-Indian', { year: 'numeric', month: 'long', day: 'numeric' }),
            }
            const __dirname = "D:/Projects/Learning Management System/backend";
            const html = await ejs.renderFile(__dirname + "/mails/order-confirmation.ejs", { order: order });
            try {
                if (user) {
                    await sendMail({
                        email: user.email,
                        subject: "Order Confirmation",
                        template: "order-confirmation.ejs",
                        data: order
                    });
                }
            }
            catch (error: any) {
                return next(new ErrorHandler("Failed to send email", 500));
            }
            user.courses.push({ courseId: (course?._id as string) });
            await user.save();
            const notification = await Notification.create({
                user: user._id,
                title: "New Order",
                message: `You have successfully purchased the course: ${course.name}`,
            });
            course.purchased = (course.purchased ?? 0) + 1;
            await course.save();
            orderService.newOrder(data, res, next);
        }
        catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    });

    export default { createOrder };