import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import User from "../entities/User";

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("cookie", req.cookies)
        const token = req.cookies.token;
        console.log("token", token)
        if(!token) return next();

        const {username}: any = jwt.verify(token, process.env.JWT_SECRET!)

        const user = await User.findOneBy({username});

        if (!user) throw new Error("Unauthenticated")

        // 유저 정보를 res.local.user에 넣어주기
        res.locals.user = user;
        return next();
    } catch (error) {
        console.log(error)
        return res.status(400).json({error: "Someting went wrong"})
    }
}