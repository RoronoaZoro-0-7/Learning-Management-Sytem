import express from "express";
import order from "../controllers/orderController";
import isAuthenticated, { authorizeRoles } from "../middleware/auth";

const router = express.Router();

router.post('/create-order', isAuthenticated, order.createOrder);
router.get('/get-all-orders', isAuthenticated, authorizeRoles("admin"), order.getAllOrders);

export default router;