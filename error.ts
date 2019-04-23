import serializeError from 'serialize-error'

class RPCError {
  name: string
  message: string
  inner: object

  constructor (error: Error) {
    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name
    this.message = error.message
    this.inner = serializeError(error)
  }
}

export {
  RPCError
}
