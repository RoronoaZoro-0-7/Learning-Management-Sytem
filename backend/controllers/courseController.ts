import { NextFunction, Request, Response } from "express";
import CatchAsyncError from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import courseService from "../services/courseService";
import Course from "../models/courseModel";
import mongoose from "mongoose";
import redis from "../utils/redis";
import sendMail from "../utils/sendMail";
import ejs from "ejs";

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
		if (isCacheExist) {
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
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

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

// get course content only for valid user
const getCourseByUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) {
			return next(new ErrorHandler("User not authenticated", 401));
		}

		const userCourses = req.user?.courses;
		if (!userCourses) {
			return next(new ErrorHandler("No courses found for this user", 404));
		}

		const courseId = req.params.id;
		if (!courseId) {
			return next(new ErrorHandler("Course ID is required", 400));
		}

		const courseExists = userCourses.some((course: any) => course._id.toString() === courseId);
		if (!courseExists) {
			return next(new ErrorHandler("You have not purchased this course", 403));
		}
		const course = await Course.findById(courseId);
		if (!course) {
			return next(new ErrorHandler("Course not found", 404));
		}
		const content = course.courseData;
		res.status(200).json({
			success: true,
			content,
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
})

// add a question
const addQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { question, courseId, contentId } = req.body;
		if (!question || !courseId || !contentId) {
			return next(new ErrorHandler("All fields are required", 400));
		}
		const course = await Course.findById(courseId);
		if (!course) {
			return next(new ErrorHandler("Course not found", 404));
		}
		if (!mongoose.Types.ObjectId.isValid(contentId)) {
			return next(new ErrorHandler("Invalid course ID", 400));
		}
		const courseContent = course.courseData?.find((item: any) => item._id.equals(contentId));
		if (!courseContent) {
			return next(new ErrorHandler("Course content not found", 404));
		}

		// create a new question object
		const newQuestion: any = {
			user: req.user,
			question,
			questionReplies: []
		}
		// add this question to the course content
		courseContent.questions.push(newQuestion);
		await course?.save();
		res.status(201).json({
			success: true,
			course
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 500));

	}
});

// reply to the question
const addAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { answer, courseId, contentId, questionId } = req.body;
		if (!answer || !courseId || !contentId || !questionId) {
			return next(new ErrorHandler("All fields are required", 400));
		}
		const course = await Course.findById(courseId);
		if (!course) {
			return next(new ErrorHandler("Course not found", 404));
		}
		if (!mongoose.Types.ObjectId.isValid(contentId)) {
			return next(new ErrorHandler("Invalid course ID", 400));
		}
		const courseContent = course.courseData?.find((item: any) => item._id.equals(contentId));
		if (!courseContent) {
			return next(new ErrorHandler("Course content not found", 404));
		}
		const question = courseContent.questions.find((q: any) => q._id.equals(questionId));
		if (!question) {
			return next(new ErrorHandler("Question not found", 404));
		}

		// create a new answer object
		const newAnswer: any = {
			user: req.user,
			answer
		}
		question.questionReplies.push(newAnswer);
		await course?.save();
		if (req.user?._id === question.user._id) {
			// create a notification
		}
		else {
			const data = {
				name: question.user.name,
				title: courseContent.title
			}
			const __dirname = "D:/Projects/Learning Management System/backend";
			const html = await ejs.renderFile(__dirname + "/mails/question-reply.ejs", data);
			try {
				await sendMail({
					email: question.user.email,
					subject: "New reply to your question",
					template: "question-reply.ejs",
					data
				});
			} catch (error: any) {
				return next(new ErrorHandler(error.message, 500));
			}
		}
		res.status(201).json({
			success: true,
			course
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 500));

	}
});

// add review
const addReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) {
			return next(new ErrorHandler("User not authenticated", 401));
		}
		const courses = req.user.courses;
		if (!courses || courses.length === 0) {
			return res.status(202).json({
				success: false,
				message: "No courses found"
			});
		}
		const courseId = req.params.id;
		if (!courseId) {
			return next(new ErrorHandler("Course ID is required", 400));
		}
		const courseExists = courses.some((course: any) => course._id.toString() === courseId.toString());
		if (!courseExists) {
			return next(new ErrorHandler("You have not purchased this course", 403));
		}
		const course = await Course.findById(courseId);
		if (!course) {
			return next(new ErrorHandler("Course not found", 404));
		}
		const { review, rating } = req.body;
		if (!review || !rating) {
			return next(new ErrorHandler("Review and rating are required", 400));
		}
		const reviewData: any = {
			user: req.user,
			rating,
			comment: review
		}
		course.reviews.push(reviewData);
		let avg = 0;
		course.reviews.forEach((rev: any) => {
			avg += rev.rating;
		})
		course.ratings = avg / course.reviews.length;
		await course.save();
		const notification = {
			title: "New Review",
			message: `You have received a new review on your course ${course.name}`
		}
		res.status(201).json({
			success: true,
			course,
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

const addReplyToReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { comment, reviewId, courseId } = req.body;
		if (!comment || !reviewId || !courseId) {
			return next(new ErrorHandler("All fields are required", 400));
		}
		const course = await Course.findById(courseId);
		if (!course) {
			return next(new ErrorHandler("Course not found", 404));
		}
		const review = course.reviews.find((rev: any) => rev._id.equals(reviewId));
		if (!review) {
			return next(new ErrorHandler("Review not found", 404));
		}
		const replyData: any = {
			user: req.user,
			comment
		};
		if(!review.commentReplies) {
			review.commentReplies = [];
		}
		review.commentReplies.push(replyData);
		await course.save();
		res.status(201).json({
			success: true,
			course
		});
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 500));
	}
});

export default { uploadCourse, editCourse, getSingleCourse, getAllCourses, getCourseByUser, addQuestion, addAnswer, addReview , addReplyToReview };