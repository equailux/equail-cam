import fs from "fs/promises"
import NodeWebcam, { WebcamOptions, FSWebcam, WindowsWebcam, ImageSnapWebcam } from "node-webcam"

//

const cameras: (FSWebcam | WindowsWebcam | ImageSnapWebcam)[] = []

//

const options: WebcamOptions = {
    quality: 100,
    frames: 60,
    delay: 0,
    saveShots: false,
    output: "jpeg",
    callbackReturn: "buffer",
    verbose: false,
}

//

const list = async (timeout = 30000) => {
    const cameras: (FSWebcam | WindowsWebcam | ImageSnapWebcam)[] = []
    let listed = false
    
    NodeWebcam.list((cams) => {
        const results = cams.map((c) => NodeWebcam.create({ ...options, device: c }))
        cameras.push(...results)
        listed = true
    })

    const alpha = Date.now()
    while (!listed) {
        const elapsed = Date.now() - alpha
        if (elapsed >= timeout) throw new Error(`[Module.Camera]: Camera listing timeout after ${elapsed}ms.`)
        await new Promise(res => setTimeout(res, 50))
    }
    return cameras
}

const capture = async (camera: FSWebcam | WindowsWebcam | ImageSnapWebcam, timeout = 30000) => {
    const path = "temp"
    await fs.rm(`${path}.jpg`).catch(() => 0)
    
    let captured = false
    let result: Buffer<ArrayBufferLike> | undefined = undefined
    
    camera.capture(path, async (err, data) => {
        if (err || typeof data == "string") return
        result = data
        captured = true
    })

    let alpha = Date.now()
    while (!captured) {
        const elapsed = Date.now() - alpha
        if (elapsed >= timeout) throw new Error(`[Module.Camera]: Capture timeout after ${elapsed}ms.`)
        await new Promise(res => setTimeout(res, 50))
    }
    
    await fs.rm(`${path}.jpg`).catch(() => 0)
    return result! as Buffer<ArrayBufferLike>
}

//

export default { cameras, options, list, capture }

