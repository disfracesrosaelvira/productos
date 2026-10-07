export const handleHttpError = (res:any, message = 'Algo sucedio', code = 403 ) => {
  res.status(code)
  res.send({ error: message })
}