import { Payload } from 'ts-nats'
import { createServer } from '../rpc'

const functions = {
  add: (a, b) => a + b,
  subtract: (a, b) => b - a,
  oops: async () => {
    throw 'oops'
  }
}

createServer({ payload: Payload.JSON }, functions)
  .then(() => console.log('Listening...'))
  .catch(console.error)
