import { NextFunction, Request, Response } from "express";
import CatchAsyncError from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import courseService from "../services/courseService";
import Course from "../models/courseModel";
import { get } from "mongoose";
import redis from "../utils/redis";

// upload course
const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      courseService.createCourse(res, data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit the course
const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const thumbnail = data.thumbnail;
    if (thumbnail) {
      await cloudinary.v2.uploader.destroy(data.thumbnail.public_id);
      const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
        folder: "courses",
      });

      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    const courseId = req.params.id;
    if (!courseId) {
      return next(new ErrorHandler("Course ID is required", 400));
    }
    const course = await Course.findByIdAndUpdate(courseId, { $set: data }, { new: true });
    res.status(201).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})

// get single course --- without purchasing
const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {

    const courseId = req.params.id;
    if (!courseId) {
      return next(new ErrorHandler("Course ID is required", 400));
    }

    const isCacheExist = await redis.get(courseId);
    if( isCacheExist) {
      const course = JSON.parse(isCacheExist);
      return res.status(200).json({
        success: true,
        course
      })
    }
    
    const course = await Course.findById(req.params.id).select(
      "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
    );
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }
    await redis.set(courseId, JSON.stringify(course), "EX", 60 * 60);

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
}
);

// get all courses --- without purchasing
const getAllCourses = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {

    const isCacheExist = await redis.get("allCourses");
    if (isCacheExist) {
      const courses = JSON.parse(isCacheExist);
      return res.status(200).json({
        success: true,
        courses
      });
    }
    const courses = await Course.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
    await redis.set("allCourses", JSON.stringify(courses), "EX", 60 * 60);
    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});

export default { uploadCourse, editCourse, getSingleCourse, getAllCourses };