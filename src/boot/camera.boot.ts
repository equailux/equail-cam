import cameraModule from "@/modules/camera.module.js"

//

const boot = async () => {
    const cameras = await cameraModule.list()
    cameraModule.cameras.push(...cameras)
    console.info(`[Boot.Camera]: Found ${cameras.length} cameras.`)
}

//

export default { boot }
