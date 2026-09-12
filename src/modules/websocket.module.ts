import env from "@/config/env.config.js"
import { RawData, WebSocket } from "ws"
import { WsEventSchema, type WsEventHandler, type WsEventOptions, type WsEventQuery } from "@/schemas/ws.event.schema.js"

//

const handlers: WsEventOptions<any>[] = []
let socket: WebSocket | undefined = undefined
let reconnecting = false

//

/** Builds the esp websocket url out of the http api url. */
const url = () => `${env.api.url?.replace(/^http/, "ws")}/ws/esp`

const subscribe = <T extends object = any>(name: string, query: WsEventQuery, handler: WsEventHandler<T>) => {
    handlers.push({ name, query, handler })
}

const connect = () => {
    const target = url()
    socket = new WebSocket(target)

    socket.on("open", () => console.info(`[Module.Websocket]: Connected to ${target}.`))
    socket.on("message", (data, isBinary) => onMessage(data, isBinary))
    socket.on("error", (err) => console.error(`[Module.Websocket]: Connection error on ${target} - ${err?.message}.`))
    socket.on("close", () => onClose())
}

//

const onMessage = async (data: RawData, isBinary: boolean) => {
    if (isBinary) return console.info(`[Module.Websocket]: Received binary message.`)

    const raw = data.toString()
    const json = await Promise
        .resolve()
        .then(() => JSON.parse(raw))
        .catch(() => undefined)
    if (!json) return console.info(`[Module.Websocket]: Received non-json message: ${raw}.`)

    const { data: parsed, success } = WsEventSchema.safeParse(json)
    if (!success) return console.info(`[Module.Websocket]: Received invalid event.`)

    const matched = handlers.filter((h) => h.name == parsed.name && h.query == parsed.query)
    for (const handler of matched) {
        await Promise.resolve()
            .then(() => handler.handler(parsed.data))
            .catch(console.error)
    }
}

const onClose = () => {
    socket = undefined
    if (reconnecting) return

    reconnecting = true
    console.info(`[Module.Websocket]: Disconnected, retrying in ${env.ws.reconnect}ms.`)
    setTimeout(() => {
        reconnecting = false
        connect()
    }, env.ws.reconnect)
}

//

export default { subscribe, connect }
