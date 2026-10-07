import { Request } from 'express';
import { User } from './user.interface';

export interface DataStoredInToken {
  user_id: string;
  rol:string;
  name:string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: User;
}
