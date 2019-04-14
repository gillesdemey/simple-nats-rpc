import { connect, Payload } from 'ts-nats'
import { createServer } from '../rpc'

const functions = {
  add: (a, b) => a + b,
  subtract: (a, b) => b - a
}

connect({ payload: Payload.JSON })
  .then(nc => createServer(nc, functions))
  .then(() => console.log('Listening...'))
  .catch(console.error)
