import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = () =>{
    if(process.env.REDIS_URL){
        console.log("Redis connected");
        return new Redis(process.env.REDIS_URL);
    }
}

export default redisClient;