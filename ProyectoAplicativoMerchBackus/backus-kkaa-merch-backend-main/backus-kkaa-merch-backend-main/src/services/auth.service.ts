import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { SECRET_KEY } from "../config";
import { HttpException } from "../exceptions/httpException";
import { DataStoredInToken, TokenData } from "../interfaces/auth.interface";
import Model from "../db/index";

const createToken = (user_id: string,rol:string,name:string): TokenData => {
  const dataStoredInToken: DataStoredInToken = { user_id: user_id,rol:rol,name:name };
  const expiresIn: number = 60 * 60 * 24 * 1; // one day

  return {
    expiresIn,
    token: sign(dataStoredInToken, SECRET_KEY!, { expiresIn }),
  };
};

export class AuthService {
  userModel = Model.collection("usuario");
  
  public async login(userData: any): Promise<{ token: string }> {
    const user: any = await this.userModel.findOne({ usuario_id: userData.userId, fecha_eliminacion: { $exists: false } });

    if (!user) throw new HttpException(409, `Usuario no encontrado`);
    
    if (user.estado==0) throw new HttpException(409, `Usuario desactivado`);

    const isPasswordMatching: boolean = await compare(
      userData.password,
      user.contraseña
    );
    
    if (!isPasswordMatching)
      throw new HttpException(409, "Contraseña incorrecta");

    const tokenData = createToken(user.usuario_id.toString(),user.rol.toString(), user.nombre.toString());
    console.log(`Bienvenido, ${user.usuario_id.toString()}`);

    return { token: tokenData.token };
  }
}
