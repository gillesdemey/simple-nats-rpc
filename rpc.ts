import { Client } from 'ts-nats'

export interface RPCInterface {
  [key:string]: Function
}

export interface RPCClient {
  request: (fnName: string, args: any[], options?: RequestOptions) => Promise<any>
}

export type RequestOptions = {
  timeout?: number
}

async function createServer (nc: Client, iface: RPCInterface): Promise<void> {
  const functions = Object.entries(iface)

  const subscribe = ([topic, fn]) => {
    console.log(`Registering "${topic}"`)

    return nc.subscribe(createTopic(topic), async (err, msg) => {
      if (err) throw err

      const response = await fn(...msg.data)
      nc.publish(msg.reply, response)
    })
  }

  await Promise.all(functions.map(subscribe))
}

function createClient (nc: Client): RPCClient {
  return {
    request: async (fnName, args, options = {}) => {
      const timeout = options.timeout || 1000
      const topic = createTopic(fnName)

      const { data } = await nc.request(topic, timeout, args)
      return data
    }
  }
}

function createTopic (topic: string): string {
  const prefix = `rpc:commands:`
  return `${prefix}${topic}`
}

export {
  createServer,
  createClient
}
