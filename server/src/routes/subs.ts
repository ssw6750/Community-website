import { NextFunction, Request, Response, Router } from "express";
import userMiddleware from '../middlewares/user'
import authMiddleware from '../middlewares/auth'
import { isEmpty } from "class-validator";
import { AppDataSource } from "../data-source";
import Sub from "../entities/Sub";
import User from "../entities/User";
import Post from "../entities/Post";

//next 타입???
const createSub = async (req: Request, res: Response, next: NextFunction) => {
    const { name, title, description } = req.body;

    try {
        let errors: any = {};
        if(isEmpty(name)) errors.name = "이름을 비워둘 수 없습니다.";
        if(isEmpty(title)) errors.title = "제목을 비워둘 수 없습니다.";

        const sub = await AppDataSource
            .getRepository(Sub)
            .createQueryBuilder("sub")
            .where("lower(sub.name) = :name", {name: name.toLowerCase()})
            .getOne();

         console.log("AAAAAAA")

        if(sub) errors.name = "서브가 이미 존재합니다."
        if(Object.keys(errors).length > 0) {
            throw errors;
        } 
    } catch (error) {
            console.log(error);
            return res.status(500).json({error: "문제가 발생했습니다."})
    }

    try {
        const user: User = res.locals.user;

        const sub = new Sub()
        sub.name = name;
        sub.description = description;
        sub.title = title;
        sub.user = user;

        await sub.save()
        return res.json(sub);
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "문제가 발생했습니다."})
    }
};

const topSubs = async (req: Request, res: Response) => {
    try {
        const imageUrlExp = `COALESCE(s."imageUrn", 'https://www.gravatar.com/avatar?d=mp&f=y')`;
        console.log("AAAA")
        const subs = await AppDataSource
            .createQueryBuilder()
            .select(`s.title, s.name, ${imageUrlExp} as "imageUrl", count(p.id) as "postCount"`)
            .from(Sub, "s")
            .leftJoin(Post, "p", `s.name = p."subName"`)
            .groupBy('s.title, s.name, "imageUrl"')
            .orderBy(`"postCount"`, "DESC")
            .limit(5)
            .execute();
        return res.json(subs);
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong"})
    }
}

const router = Router();

router.post("/", userMiddleware, authMiddleware, createSub);
router.get("/sub/topSubs", topSubs);

export default router