import { connect, Msg, NatsConnectionOptions } from 'ts-nats'

export type NatsOptions = string | number | NatsConnectionOptions

export interface RPCInterface {
  [key:string]: Function
}

export interface RPCClient {
  request: (fnName: string, args: any[], options?: RequestOptions) => Promise<any>
}

export type RequestOptions = {
  timeout?: number
}

async function createServer (natsOptions: NatsOptions, iface: RPCInterface): Promise<void> {
  const nc = await connect(natsOptions)
  const functions = Object.entries(iface)

  const subscribe = ([topic, fn]) => {
    return nc.subscribe(createTopic(topic), async (err: Error, msg: Msg) => {
      if (err) throw err

      const { data: args = [] } = msg

      const response = await fn(...args)
      nc.publish(msg.reply, response)
    })
  }

  await Promise.all(functions.map(subscribe))
}

async function createClient (natsOptions: NatsOptions): Promise<RPCClient> {
  const nc = await connect(natsOptions)

  return {
    request: async (fnName, args = [], options = {}) => {
      const timeout = options.timeout || 1000
      const topic = createTopic(fnName)

      const { data } = await nc.request(topic, timeout, [].concat(args))
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
