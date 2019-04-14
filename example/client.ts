import { connect, Payload } from 'ts-nats'
import { createClient } from '../rpc'

connect({ payload: Payload.JSON })
  .then(nc => {
    const client = createClient(nc)
    
    return Promise.all([
      client.request('add', [1, 2], { timeout: 1000 }),
      client.request('subtract', [5, 10])
    ])
    .then(console.log)
  })
  .catch(console.error)
