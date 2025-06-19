import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";
import ErrorHandler from "../utils/ErrorHandler";
import CatchAsyncError from "../middleware/catchAsyncError";
import jwt, { Secret } from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import ejs from 'ejs';
import path from 'path';
import dotenv from 'dotenv';

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

        // return res.status(201).json({
        //     success:true,
        //     activationtoken
        // })
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

export default { register, activationToken };