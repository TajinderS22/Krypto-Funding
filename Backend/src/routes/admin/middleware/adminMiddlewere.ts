import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.headers.authorization;


    let token: string | undefined;

    if (authHeader) {
        token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({ message: "Authorization token is missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user_id = decoded; 
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }

    next();
};

export default adminMiddleware;