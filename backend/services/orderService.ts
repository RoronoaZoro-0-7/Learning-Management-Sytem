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

// get all orders - only for admin
const getAllOrders = async (res: Response) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        orders
    })
}

export default { newOrder, getAllOrders };