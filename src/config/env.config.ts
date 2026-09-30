//

/** Parses a detection threshold, falling back when unset or unparseable. */
const threshold = (value: string | undefined, fallback: number) => {
    if (!value?.trim()) return fallback

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

/** Parses an image size, falling back when unset or unparseable, where 0 disables resizing. */
const imgsz = (value: string | undefined, fallback: number) => {
    if (!value?.trim()) return fallback

    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

//

const env = {
    ai: {
        api: {
            url: process.env.AI_API_URL,
            key: process.env.AI_API_KEY,
        },
        egg: {
            imgsz: imgsz(process.env.EGG_IMGSZ, 256),
        },
        feed: {
            imgsz: imgsz(process.env.FEED_IMGSZ, 256),
            score: threshold(process.env.FEED_SCORE, 0.25),
            iou: threshold(process.env.FEED_IOU, 0.5),
        },
    },
    api: {
        url: process.env.API_URL,
        key: process.env.API_KEY,
    },
    ws: {
        reconnect: Number(process.env.WS_RECONNECT || 5000),
    },
    capture: {
        interval: Number(process.env.CAPTURE_INTERVAL),
        immediate: process.env.CAPTURE_IMMEDIATE == "true",
    },
}

//

export default env
