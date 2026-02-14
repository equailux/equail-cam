import cameraBoot from "@/boot/camera.boot.js";
import cameraTask from "@/tasks/camera.task.js";

//

await cameraBoot.boot()
await cameraTask.run(60000)
