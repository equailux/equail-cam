
//

const env = {
    ai: {
        api: {
            url: process.env.AI_API_URL,
            key: process.env.AI_API_KEY,
        },
    },
    api: {
        url: process.env.API_URL,
        key: process.env.API_KEY,
    },
    capture: {
        interval: Number(process.env.CAPTURE_INTERVAL),
        immediate: process.env.CAPTURE_IMMEDIATE == "true",
    },
}

//

export default env
