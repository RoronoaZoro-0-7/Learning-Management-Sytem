import express from "express";
import order from "../controllers/orderController";
import isAuthenticated, { authorizeRoles } from "../middleware/auth";

const router = express.Router();

router.post('/create-order', isAuthenticated, order.createOrder);

export default router;