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

export default { getUserById, getAllUsers };