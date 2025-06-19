import express from "express";
import user from "../controllers/userController";
const route = express.Router();

route.post("/registration", user.register);
route.post("/activate-user", user.activateUser);

export default route;