const { validationResult } = require('express-validator')

export const validateResults = (req: any, res: any, next:any) => {
  try {
    validationResult(req).throw()
    return next()
  } catch (error: any) {
    res.status(403)
    res.send({ errors: error.array() })
  }
}