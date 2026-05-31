import z from "zod"
import fs from "fs/promises"
import env from "@/config/env.config.js"
import cameraModule from "@/modules/camera.module.js"
import { CaptureSchema } from "@/schemas/capture.schema.js"
import { DetectionRawSchema, DetectionSchema } from "@/schemas/detection.schema.js"
import type { FSWebcam, WindowsWebcam, ImageSnapWebcam } from "node-webcam"

//

const run = async (interval = 60000, immediate = true) => {
    if (immediate) await loop(cameraModule.cameras).catch(console.error)
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
        if (!buffer) console.error(`[Task.Camera]: ${camname} failed to capture.`)
        if (!buffer) continue
        
        console.info(`[Task.Camera]: ${camname} captured in ${Date.now() - timer}ms.`)
        const uint8 = new Uint8Array(buffer)
        const blob = new Blob([uint8], { type: "image/jpeg" })

        // --- Send Capture
        timer = Date.now()
        let form = new FormData()
        form.append("image", blob, `${Date.now()}.jpg`)
        form.append("camera", `${camname}`)

        let headers: Record<string, any> = { "x-api-key": env.api.key }
        let url = `${env.api.url}/esp/capture`
        let cid = 0
        
        await fetch(url, { body: form, method: "POST", headers })
            .then((res) => res.json())
            .then((res) => CaptureSchema.parse(res))
            .then((res) => cid = res.id)
            .catch(console.error)
        console.info(`[Task.Camera]: ${camname} image sent in ${Date.now() - timer}ms.`)

        //

        // --- Request Egg Detection
        timer = Date.now()
        form = new FormData()
        form.append("image", blob)
        headers = { "x-api-key": env.ai.api.key }
        url = `${env.ai.api.url}/api/egg/predict`

        let res = await fetch(url, { body: form, method: "POST", headers })
            .then((res) => res.json())
            .then((res) => z.array(DetectionRawSchema).parse(res))
            .catch(console.error)
        if (!res) console.error(`[Task.Camera]: ${camname} image egg detection failed.`)
        if (!res) continue
        console.info(`[Task.Camera]: ${camname} image found ${res.length} egg detections in ${Date.now() - timer}ms.`)

        // --- Send Egg Detection
        timer = Date.now()
        headers = { "Content-Type": "application/json", "x-api-key": env.api.key }
        url = `${env.api.url}/esp/capture/${cid}/detection`
        let promises: Promise<any>[] = []

        for (const detection of res) {
            const options = { body: JSON.stringify(detection), method: "POST", headers }
            const promise = fetch(url, options).catch(console.error)
            promises.push(promise)
        }

        await Promise.all(promises).catch(console.error)
        console.info(`[Task.Camera]: ${camname} image egg detections sent in ${Date.now() - timer}ms.`)
        
        //
        
        // --- Request Feed Detection
        timer = Date.now()
        form = new FormData()
        form.append("image", blob)
        headers = { "x-api-key": env.ai.api.key }
        url = `${env.ai.api.url}/api/feed/predict`

        res = await fetch(url, { body: form, method: "POST", headers })
            .then((res) => res.json())
            .then((res) => z.array(DetectionRawSchema).parse(res))
            .catch(console.error)
        if (!res) console.error(`[Task.Camera]: ${camname} image feed detection failed.`)
        if (!res) continue
        console.info(`[Task.Camera]: ${camname} image found ${res.length} feed detections in ${Date.now() - timer}ms.`)

        // --- Send Feed Detection
        timer = Date.now()
        headers = { "Content-Type": "application/json", "x-api-key": env.api.key }
        url = `${env.api.url}/esp/capture/${cid}/detection`
        promises = []
        
        const detections: DetectionSchema[] = []
        for (const detection of res) {
            const options = { body: JSON.stringify(detection), method: "POST", headers }
            const promise = fetch(url, options)
                .then(res => res.json())
                .then(res => detections.push(res as DetectionSchema))
                .catch(console.error)
            promises.push(promise)
        }

        await Promise.all(promises).catch(console.error)
        console.info(`[Task.Camera]: ${camname} image feed detections sent in ${Date.now() - timer}ms.`)

        // --- Send Feed Level
        timer = Date.now()
        headers = { "Content-Type": "application/json", "x-api-key": env.api.key }
        promises = []

        for (const detection of detections) {
            const options = { body: JSON.stringify({ level: Number(detection.class), detectionId: detection.id }), method: "POST", headers }
            url = `${env.api.url}/api/feed`
            const promise = fetch(url, options).catch(console.error)
            promises.push(promise)
        }

        await Promise.all(promises).catch(console.error)
        console.info(`[Task.Camera]: ${camname} image feed levels sent in ${Date.now() - timer}ms.`)

    }
}

//

export default { run, loop }
