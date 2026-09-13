//

/** Parses a detection threshold, falling back when unset or unparseable. */
const threshold = (value: string | undefined, fallback: number) => {
    if (!value?.trim()) return fallback

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

//

const env = {
    ai: {
        api: {
            url: process.env.AI_API_URL,
            key: process.env.AI_API_KEY,
        },
        feed: {
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
