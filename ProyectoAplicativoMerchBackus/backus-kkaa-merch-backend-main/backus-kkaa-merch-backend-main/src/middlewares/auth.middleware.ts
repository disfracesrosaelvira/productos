import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '../config';
import { DataStoredInToken, RequestWithUser } from '../interfaces/auth.interface';
import Model from '../db/index';

const getAuthorization = (req:any) => {

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
};

export const authMiddleware = async (req:any, res:any, next:any) => {
  const userModel = Model.collection("usuario");
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const data = verify(Authorization!, SECRET_KEY!) as DataStoredInToken;
      const findUser = await userModel.findOne({ usuario_id: data.user_id });

      if (findUser) {
        req.user = findUser;
        next();
      } else {
        return res.status(403).json({ error: 'AWrong authentication token' });
      }
    } else {
      return res.status(401).json({ error: 'Authentication token missing' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'No estás autorizado para acceder a este recurso.' });
  }
};
