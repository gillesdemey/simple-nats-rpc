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

enum RPCStatus {
  Failed = 'FAILED',
  Success = 'SUCCESS'
}

export interface RPCResponse {
  status: RPCStatus
  error?: object
  result?: any
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
        nc.publish(msg.reply, createRPCResponse(err))
        return
      }

      const { data: args = [] } = msg

      try {
        const response = await fn(...args)
        nc.publish(msg.reply, createRPCResponse(null, response))
      } catch (err) {
        nc.publish(msg.reply, createRPCResponse(new RPCError(err)))
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

function createRPCResponse (error?: Error | null, response?: any): RPCResponse {
  return {
    status: error ? RPCStatus.Failed : RPCStatus.Success,
    error: error || undefined,
    response: response || undefined
  } as RPCResponse
}

export {
  createServer,
  createClient
}
