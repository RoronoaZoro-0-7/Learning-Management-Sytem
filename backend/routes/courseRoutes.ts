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
export default route;