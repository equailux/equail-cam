import env from "@/config/env.config.js"
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

    socket.addEventListener("open", () => console.info(`[Module.Websocket]: Connected to ${target}.`))
    socket.addEventListener("message", (event) => onMessage(event.data))
    socket.addEventListener("error", () => console.error(`[Module.Websocket]: Connection error on ${target}.`))
    socket.addEventListener("close", () => onClose())
}

//

const onMessage = async (raw: unknown) => {
    if (typeof raw != "string") return console.info(`[Module.Websocket]: Received non-text message.`)

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
