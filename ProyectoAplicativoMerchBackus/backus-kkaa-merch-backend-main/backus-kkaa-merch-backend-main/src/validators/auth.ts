import { check } from "express-validator";
import { validateResults } from '../utils/handleValidator';

export const validatorLogin = [
  check('password')
  .exists()
  .notEmpty()
  .isLength({ min: 3, max: 50}),
  check('userId')
  .exists()
  .notEmpty(),
  (req:any, res:any, next:any) => validateResults(req, res, next)
]

export const validatorRegister = [
  check('name')
  .exists()
  .notEmpty()
  .isLength({ min: 3, max: 99}),
  check('password')
  .exists()
  .notEmpty()
  .isLength({ min: 3, max: 50}),
  check('email')
  .exists()
  .notEmpty()
  .isEmail(),
  check('age')
  .exists()
  .notEmpty()
  .isNumeric(),
  (req:any, res: any, next: any) => validateResults(req, res, next)
]