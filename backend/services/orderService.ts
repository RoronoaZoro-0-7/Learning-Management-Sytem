import { NextFunction, Response } from "express";
import CatchAsyncError from "../middleware/catchAsyncError";
import Order from "../models/orderModel";

const newOrder = CatchAsyncError(async (data: any, res: Response, next: NextFunction) => {
    const order = await Order.create(data);
    res.status(201).json({
        success: true,
        order
    });
});

export default { newOrder };