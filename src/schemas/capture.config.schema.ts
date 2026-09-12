import z from "zod"

//

const CaptureConfigSchema = z.object({
    id: z.coerce.number().int(),
    intervalMs: z.coerce.number().int().min(5000),
    enabled: z.coerce.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

const CaptureConfigCommandSchema = CaptureConfigSchema.pick({ intervalMs: true, enabled: true })

//

type CaptureConfigSchema = z.infer<typeof CaptureConfigSchema>
type CaptureConfigCommandSchema = z.infer<typeof CaptureConfigCommandSchema>

//

export { CaptureConfigSchema, CaptureConfigCommandSchema }
