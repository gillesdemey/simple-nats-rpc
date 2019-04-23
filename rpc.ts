import { connect, Msg, NatsConnectionOptions } from 'ts-nats'
import { RPCError } from './error'

export type NatsOptions = string | number | NatsConnectionOptions

export interface RPCInterface {
  [key:string]: Function
}

export interface RPCClient {
  request: (fnName: string, args: any[], options?: RequestOptions) => Promise<any>
  close: () => Promise<any>
}

export type RequestOptions = {
  timeout?: number
}

async function createServer (natsOptions: NatsOptions, iface: RPCInterface): Promise<void> {
  const nc = await connect(natsOptions)
  const functions = Object.entries(iface)

  const subscribe = ([topic, fn]) => {
    nc.subscribe(createTopic(topic), async (err: Error, msg: Msg) => {
      if (err) {
        nc.publish(msg.reply, err)
        return
      }

      const { data: args = [] } = msg

      try {
        const response = await fn(...args)
        debugger
        nc.publish(msg.reply, response)
      } catch (err) {
        nc.publish(msg.reply, new RPCError(err))
      }
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
    },
    close: () => nc.drain()
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
