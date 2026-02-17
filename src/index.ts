import cameraBoot from "@/boot/camera.boot.js";
import env from "@/config/env.config.js";
import cameraTask from "@/tasks/camera.task.js";

//

await cameraBoot.boot()
await cameraTask.run(env.capture.interval, env.capture.immediate)
