import express from "express";
import course from "../controllers/courseController";
import isAuthenticated, { authorizeRoles, updateAccessToken } from "../middleware/auth";
const route = express.Router();

route.post('/upload-course', isAuthenticated,
    authorizeRoles("admin"), course.uploadCourse);

route.put('/edit-course/:id', isAuthenticated,
    authorizeRoles("admin"), course.editCourse);

route.get('/get-course/:id', course.getSingleCourse);
route.get('/get-all-courses', course.getAllCourses);
route.get('/get-course-content/:id', isAuthenticated,
    course.getCourseByUser);

route.put('/add-question', isAuthenticated,
    course.addQuestion);
route.put('/add-answer', isAuthenticated,
    course.addAnswer);
route.put("/add-review/:id", isAuthenticated,
    course.addReview);

route.put('/add-review-reply',isAuthenticated,
    authorizeRoles("admin"),
    course.addReplyToReview);

route.get('/get-all-courses-admin', isAuthenticated,
    authorizeRoles("admin"), course.getAllCoursesAdmin);
    
export default route;