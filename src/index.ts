import cameraBoot from "@/boot/camera.boot.js";
import captureTask from "@/tasks/capture.task.js";

//

await cameraBoot.boot()
await captureTask.run()
