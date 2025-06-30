import express from "express";
import analytics from "../controllers/analyticsController";
import isAuthenticatedUser, { authorizeRoles } from "../middleware/auth";

const router = express.Router();
router.get("/get-users-analytics", isAuthenticatedUser,
    authorizeRoles("admin"), analytics.getUsersAnalytics);

router.get("/get-courses-analytics", isAuthenticatedUser,
    authorizeRoles("admin"), analytics.getCoursesAnalytics);

router.get("/get-orders-analytics", isAuthenticatedUser,
    authorizeRoles("admin"), analytics.getOrdersAnalytics);

export default router;