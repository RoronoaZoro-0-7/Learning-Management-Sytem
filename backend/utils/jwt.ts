import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { IUser } from "../models/userModel";
import redis from "./redis";
import { Response } from "express";

dotenv.config();

export interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
}

const sendToken = (user: IUser, statusCode: number, res: Response) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // upload session to redis
    redis.set(user._id.toString(), JSON.stringify(user));

    // parse enviroment variables to integrates with fallback values
    const accessTokenExpire = 432000; // 5 days in seconds
    const refreshTokenExpire = 432000; // 5 days in seconds
    console.log(`Access Token Expire: ${accessTokenExpire} seconds`);
    
    // options for cookies
    const accessTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + accessTokenExpire * 1000), // seconds to ms
        maxAge: accessTokenExpire * 1000, // seconds to ms
        httpOnly: true,
        sameSite: 'lax',
    };
    console.log(accessTokenOptions);
    

    const refreshTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + refreshTokenExpire * 1000), // seconds to ms
        maxAge: refreshTokenExpire * 1000, // seconds to ms
        httpOnly: true,
        sameSite: 'lax',
    };

    if (process.env.NODE_ENV === 'production') {
        accessTokenOptions.secure = true;
    }
    console.log(process.env.NODE_ENV);
    
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    console.log(res.cookie);
    
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
        refreshToken,
    });
}

export default sendToken;