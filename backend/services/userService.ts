import User, { IUser } from "../models/userModel";
import { Response } from "express";
import redis from "../utils/redis";

const getUserById = async (id: string): Promise<IUser | null> => {
    const userJson = await redis.get(id);
    if (!userJson) {
        return null;
    }

    const user = JSON.parse(userJson);
    return user;
};

// get all users - only for admin
const getAllUsers = async (res: Response) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        users
    })
}

// update user role - only for admin
const updateUserRole = async (res: Response, id: string, role: string) => {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }
    await redis.set(id, JSON.stringify(user));
    res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user
    });
};

export default { getUserById, getAllUsers, updateUserRole };