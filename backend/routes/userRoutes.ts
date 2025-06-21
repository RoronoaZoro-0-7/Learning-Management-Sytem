import express from "express";
import user from "../controllers/userController";
import isAuthenticated from "../middleware/auth";
const route = express.Router();

route.post("/registration", user.register);
route.post("/activate-user", user.activateUser);
route.post("/login",user.login);
route.post("/logout",isAuthenticated,user.logout);

export default route;