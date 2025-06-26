import { Request, Response, NextFunction } from "express";
import CatchAsyncError from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import redis from "../utils/redis";
import { IUser } from "../models/userModel";
import { ITokenOptions } from "../utils/jwt";

const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;

    if (!access_token) {
      return next(new ErrorHandler("Please login to access this resource", 400));
    }

    const decoded = jwt.verify(
      access_token,
      process.env.ACCESS_SECRET as Secret
    ) as JwtPayload;

    if (!decoded) {
      return next(new ErrorHandler("access token is not valid", 400));
    }

    const user = await redis.get(decoded.id as string);

    if (!user) {
      return next(new ErrorHandler("user not found", 400));
    }
    req.user = JSON.parse(user);
    next();
  }
);

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ErrorHandler("Unauthorized access", 403));
    }
    next();
  };
};

export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;

      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as Secret
      ) as JwtPayload;

      const message = "Could not refresh token"; // This message is used for both !decoded and !session checks

      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }

      const session = await redis.get(decoded.id as string);

      if (!session) {
        return next(new ErrorHandler(message, 400));
      }

      // Completed line: parse the session data, assuming it's a JSON string
      const user = JSON.parse(session);
      const accesstoken = jwt.sign({ id: user._id }, process.env.ACCESS_SECRET as Secret, { expiresIn: "120d" });
      const refreshtoken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as Secret, { expiresIn: "120d" });

      // parse enviroment variables to integrates with fallback values
      const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10);
      const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10);

      // options for cookies
      const accessTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + accessTokenExpire * 1000),
        maxAge: accessTokenExpire * 1000,
        httpOnly: true,
        sameSite: 'lax',
      };

      const refreshTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + refreshTokenExpire * 1000),
        maxAge: refreshTokenExpire * 1000,
        httpOnly: true,
        sameSite: 'lax',
      };

      res.cookie("access_token", accesstoken, accessTokenOptions);
      res.cookie("refresh_token", refreshtoken, refreshTokenOptions);

      return res.status(200).json({
        status:"success",
        accesstoken
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export default isAuthenticated;