import { Response } from "express";
import Course from "../models/courseModel";

const createCourse = async (res: Response, data: any) => {
  const course = await Course.create(data);
  res.status(201).json({
    success: true,
    course,
  });
};

export default { createCourse };