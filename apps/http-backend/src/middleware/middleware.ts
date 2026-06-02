import { JWT_SECRET } from '@repo/backend-common/config';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';


export const middleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["authorization"] || "";

  const decodedData = jwt.verify(token, JWT_SECRET) as JwtPayload;
  if(decodedData){
    req.userId = decodedData.userId;
    next();
  } else {
    res.status(403).send({
      message: "Invalid Token / Unauthorized"
    })
  }
};