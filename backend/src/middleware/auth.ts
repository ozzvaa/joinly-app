import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  role: string;
}


export function readUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    } catch {
        req.user = undefined;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Za to se morate prijaviti." });
    return;
  }
  next();
}