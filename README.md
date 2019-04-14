# NATS RPC

Simple RPC via NATS

## Example

**server.ts**

```typescript
import { createServer } from 'simple-nats-rpc'

const functions = {
  add: (a, b) => a + b,
  subtract: (a, b) => b - a
}

const nc = await connect({ payload: Payload.JSON })
createServer(nc, functions)
```

**client.ts**

```typescript
import { createClient } from 'simple-nats-rpc'

const nc = await connect({ payload: Payload.JSON })
const client = createClient(nc)

const result = await client.request('add', [1, 2], { timeout: 1000 })
// => 3

const result2 = await client.request('subtract', [5, 10])
// => 5
```
