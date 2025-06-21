import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";
import ErrorHandler from "../utils/ErrorHandler";
import CatchAsyncError from "../middleware/catchAsyncError";
import jwt, { Secret } from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import ejs from 'ejs';
import path from 'path';
import dotenv from 'dotenv';
import sendToken from "../utils/jwt";

dotenv.config();

// interface Registration body
interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

const register = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return next(new ErrorHandler("User already exist", 400));
        }
        const user: IRegistrationBody = {
            name,
            email,
            password
        }
        const activationtoken = activationToken(user);
        const activationCode = activationtoken.activationCode;
        console.log(`SMTP Password is: "${process.env.SMTP_PASSWORD}"`);

        const data = {
            user: { name: user.name },
            activationCode
        }
        try {
            const __dirname = "D:/Projects/LMS/backend";
            console.log(__dirname);

            const html = await ejs.renderFile(path.join(__dirname, "/mails/activation-mail.ejs"), data);

            await sendMail({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data
            });
        } catch (err: any) {
            console.error("Failed to send email:", err.message);
            return next(new ErrorHandler("Email sending failed: " + err.message, 500));
        }

        res.status(201).json({
            success: true,
            message: `Check your email : ${user.email} to activate your account`,
            activationToken: activationtoken.token,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

interface IActivationToken {
    token: string;
    activationCode: string;
}

const activationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign(
        {
            user,
            activationCode,
        },
        process.env.ACTIVATION_SECRET as Secret,
        {
            expiresIn: "15d",
        }
    );
    return { token, activationCode };
}

interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

const activateUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { activation_token, activation_code } =
                req.body as IActivationRequest;

            const newUser: { user: IUser; activationCode: string } = jwt.verify(
                activation_token,
                process.env.ACTIVATION_SECRET as Secret
            ) as { user: IUser; activationCode: string };

            if (newUser.activationCode !== activation_code) {
                return next(new ErrorHandler("Invalid activation code", 400));
            }

            const { name, email, password } = newUser.user;

            const existUser = await User.findOne({ email });

            if (existUser) {
                return next(new ErrorHandler("User already exist", 400));
            }
            const user = await User.create({
                name,
                email,
                password
            });
            res.status(201).json({
                success: true,

            })
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

interface loginRequest {
    email: string;
    password: string;
}

const login = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400));
        }
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }
        const isPasswordMatched = await user.comparePassword(password);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }
        sendToken(user, 200, res);
    } catch (error: any) {
        return new ErrorHandler(error.message, 400);
    }
})

const logout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("access_token", "", {
        httpOnly: true,
        expires: new Date(0),
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    });

    res.cookie("refresh_token", "", {
        httpOnly: true,
        expires: new Date(0),
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});

export default { register, activationToken, activateUser, login, logout };