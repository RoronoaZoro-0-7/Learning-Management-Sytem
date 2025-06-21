// global.d.ts
import { IUser } from "./models/userModel"; // Adjust path if needed

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}