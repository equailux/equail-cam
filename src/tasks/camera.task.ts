import z from "zod"
import env from "@/config/env.config.js"
import cameraModule from "@/modules/camera.module.js"
import { CaptureSchema } from "@/schemas/capture.schema.js"
import { DetectionRawSchema } from "@/schemas/detection.schema.js"
import type { FSWebcam, WindowsWebcam, ImageSnapWebcam } from "node-webcam"

//

const run = async (interval = 60000) => {
    setInterval(() => loop(cameraModule.cameras).catch(console.error), interval)
    console.info(`[Task.Camera]: Camera task running.`)
}

//

const loop = async (cameras: (FSWebcam | WindowsWebcam | ImageSnapWebcam)[]) => {
    for (const [index, camera] of cameras.entries()) {
        
        // --- Capture
        let timer = Date.now()
        const camname = `Camera${index + 1}`
        const buffer = await cameraModule.capture(camera).catch(console.error)
        if (!buffer) continue
        
        console.info(`[Task.Camera]: ${camname} captured in ${Date.now() - timer}ms.`)
        const uint8 = new Uint8Array(buffer)
        const blob = new Blob([uint8], { type: "image/jpeg" })

        // --- Send Capture
        timer = Date.now()
        let form = new FormData()
        form.append("image", blob, `${Date.now()}.jpg`)
        form.append("camera", `${camname}`)

        let headers: Record<string, any> = { "Authorization": `Bearer ${env.api.key}` }
        let url = `${env.api.url}/api/capture`
        let cid = 0
        
        await fetch(url, { body: form, method: "POST", headers })
            .then((res) => res.json())
            .then((res) => CaptureSchema.parse(res))
            .then((res) => cid = res.id)
            .catch(console.error)
        console.info(`[Task.Camera]: ${camname} image sent in ${Date.now() - timer}ms.`)

        // --- Request Detection
        timer = Date.now()
        form = new FormData()
        form.append("image", blob)
        headers = { "x-api-key": env.ai.api.key }
        url = `${env.ai.api.url}/api/egg/predict`

        let res = await fetch(url, { body: form, method: "POST", headers })
            .then((res) => res.json())
            .then((res) => z.array(DetectionRawSchema).parse(res))
            .catch(console.error)
        if (!res) continue
        console.info(`[Task.Camera]: ${camname} image found ${res.length} detections in ${Date.now() - timer}ms.`)

        // --- Send Detection
        timer = Date.now()
        headers = { "Content-Type": "application/json", "Authorization": `Bearer ${env.api.key}` }
        url = `${env.api.url}/api/capture/${cid}/detection`
        const promises: Promise<any>[] = []

        for (const detection of res) {
            const options = { body: JSON.stringify(detection), method: "POST", headers }
            const promise = fetch(url, options).catch(console.error)
            promises.push(promise)
        }

        await Promise.all(promises).catch(console.error)
        console.info(`[Task.Camera]: ${camname} image detections sent in ${Date.now() - timer}ms.`)
    }
}

//

export default { run, loop }
