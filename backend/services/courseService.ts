import { Response } from "express";
import Course from "../models/courseModel";

const createCourse = async (res: Response, data: any) => {
	const course = await Course.create(data);
	res.status(201).json({
		success: true,
		course,
	});
};

// Function to get all courses
const getAllCourses = async (res: Response) => {
	const courses = await Course.find().sort({ createdAt: -1 });
	res.status(201).json({
		success: true,
		courses
	})
}

export default { createCourse, getAllCourses };