import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt, { Secret } from "jsonwebtoken";

dotenv.config();

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  _id:Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken:() => string;
  SignRefreshToken:() => string
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// encrypt password
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// sign access token
userSchema.methods.SignAccessToken = function(){
  return jwt.sign({id:this.id},process.env.ACCESS_SECRET as Secret,{expiresIn:"2d"})
}

// sign refresh token
userSchema.methods.SignRefreshToken = function(){
  return jwt.sign({id:this.id},process.env.REFRESH_TOKEN as Secret,{expiresIn:"120d"})
}

// compare password during login
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;