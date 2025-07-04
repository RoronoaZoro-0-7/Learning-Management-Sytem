import express from "express";
import user from "../controllers/userController";
import isAuthenticated, { authorizeRoles, updateAccessToken } from "../middleware/auth";
const route = express.Router();

route.post("/registration", user.register);
route.post("/activate-user", user.activateUser);
route.post("/login", user.login);
// route.post("/logout", isAuthenticated, authorizeRoles("admin"), user.logout);
route.post("/logout", isAuthenticated, user.logout);
route.get("/refresh-token", updateAccessToken);
route.get("/me", isAuthenticated, user.getUserInfo);
route.post("/social-auth", user.socialAuth);
route.put("/update-user", isAuthenticated, user.updateUserInfo);
route.put("/update-password", isAuthenticated, user.updateUserPassword);
route.put("/update-profile-picture", isAuthenticated, user.updateProfilePicture);
route.get("/get-all-users", isAuthenticated, authorizeRoles("admin"), user.getAllUsers);
route.put("/update-user-role", isAuthenticated, authorizeRoles("admin"), user.updateUserRole);
route.delete("/delete-user/:id", isAuthenticated, authorizeRoles("admin"), user.deleteUser);

export default route;