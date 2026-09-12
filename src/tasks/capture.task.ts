import env from "@/config/env.config.js"
import cameraTask from "@/tasks/camera.task.js"
import websocketModule from "@/modules/websocket.module.js"
import { CaptureConfigCommandSchema, CaptureConfigSchema } from "@/schemas/capture.config.schema.js"

//

/** Pulls the stored capture config, falling back to the env defaults when unreachable. */
const retrieve = async (): Promise<CaptureConfigCommandSchema> => {
    const fallback = { intervalMs: env.capture.interval, enabled: true }

    const headers = { "x-api-key": env.api.key as string }
    const url = `${env.api.url}/esp/capture/config`

    const config = await fetch(url, { method: "GET", headers })
        .then((res) => res.json())
        .then((res) => CaptureConfigSchema.parse(res))
        .catch((err) => {
            console.error(`[Task.Capture]: Failed to retrieve capture config.`, err)
            return undefined
        })
    if (!config) return fallback

    return { intervalMs: config.intervalMs, enabled: config.enabled }
}

//

const run = async () => {
    const config = await retrieve()
    console.info(`[Task.Capture]: Capture config interval ${config.intervalMs}ms, enabled ${config.enabled}.`)

    websocketModule.subscribe("Capture", "Create", onTriggerCapture)
    websocketModule.subscribe("CaptureConfig", "Update", onUpdateConfig)
    websocketModule.connect()

    if (env.capture.immediate && config.enabled) await cameraTask.trigger()
    cameraTask.schedule(config.intervalMs, config.enabled)
    console.info(`[Task.Capture]: Capture task running.`)
}

//

const onTriggerCapture = async () => {
    console.info(`[Task.Capture]: Manual capture requested.`)
    await cameraTask.trigger()
}

const onUpdateConfig = async (data: unknown[]) => {
    const { data: config, success } = CaptureConfigCommandSchema.safeParse(data.at(0))
    if (!success) return console.info(`[Task.Capture]: Received invalid capture config.`)

    console.info(`[Task.Capture]: Capture config updated to ${config.intervalMs}ms, enabled ${config.enabled}.`)
    cameraTask.schedule(config.intervalMs, config.enabled)
}

//

export default { run, retrieve }
