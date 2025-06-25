import User, { IUser } from "../models/userModel";
import { Response } from "express";
import redis from "../utils/redis";

const getUserById = async (id: string): Promise<IUser | null> => {
    const userJson = await redis.get(id);
    if(!userJson){
        return null;
    }

    const user = JSON.parse(userJson);
    return user;
};

export default { getUserById };