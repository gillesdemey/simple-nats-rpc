import { Payload } from 'ts-nats'
import { createClient } from '../rpc'

createClient({ payload: Payload.JSON })
  .then(client => {
    return Promise.all([
      client.request('add', [1, 2], { timeout: 1000 }),
      client.request('subtract', [5, 10]),
      client.request('oops', [])
    ])
    .then(console.log)
    .then(() => client.close())
  })
  .catch(console.error)
