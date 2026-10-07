import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { handleHttpError } from '../utils/handleError';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  } 

  login = async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      const { token } = await this.authService.login(userData);
      var response = { token };
      res.status(200).json(response);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
}