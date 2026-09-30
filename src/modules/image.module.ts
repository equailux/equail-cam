import sharp from "sharp"

//

/** Decodes an uncompressed 24 or 32 bit bitmap into raw rgb pixels, since sharp cannot read bmp. */
const bitmap = (buffer: Buffer<ArrayBufferLike>) => {
    const offset = buffer.readUInt32LE(10)
    const width = buffer.readInt32LE(18)
    const height = buffer.readInt32LE(22)
    const bpp = buffer.readUInt16LE(28)
    const compression = buffer.readUInt32LE(30)

    if (bpp != 24 && bpp != 32) throw new Error(`[Module.Image]: Unsupported bitmap depth ${bpp}.`)
    if (compression != 0 && compression != 3) throw new Error(`[Module.Image]: Unsupported bitmap compression ${compression}.`)

    const rows = Math.abs(height)
    const bytes = bpp / 8
    const stride = Math.floor((bpp * width + 31) / 32) * 4
    const pixels = Buffer.alloc(width * rows * 3)

    for (let y = 0; y < rows; y++) {
        const row = offset + (height > 0 ? rows - 1 - y : y) * stride
        for (let x = 0; x < width; x++) {
            const src = row + x * bytes
            const dst = (y * width + x) * 3
            pixels[dst] = buffer[src + 2]
            pixels[dst + 1] = buffer[src + 1]
            pixels[dst + 2] = buffer[src]
        }
    }

    return sharp(pixels, { raw: { width, height: rows, channels: 3 } })
}

/** Loads an image into sharp, decoding bitmaps manually since windows webcams only output bmp. */
const load = (buffer: Buffer<ArrayBufferLike>) => {
    const isBitmap = buffer.length > 54 && buffer.toString("latin1", 0, 2) == "BM"
    return isBitmap ? bitmap(buffer) : sharp(buffer).rotate()
}

/** Downscales an image so its longest side fits the size, skipping when size is not positive. */
const resize = async (buffer: Buffer<ArrayBufferLike>, size: number, quality = 90) => {
    if (!Number.isFinite(size) || size <= 0) return buffer

    return await load(buffer)
        .resize(size, size, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer()
}

/** Wraps an image buffer into a jpeg blob for form uploads. */
const blob = (buffer: Buffer<ArrayBufferLike>) => {
    const uint8 = new Uint8Array(buffer)
    return new Blob([uint8], { type: "image/jpeg" })
}

//

export default { resize, blob }
