import * as zod from "zod"
import {extendZod} from 'zod-currency';

const z = extendZod(zod)

export const RequestSchema = z.object({
    amount: z.number().multipleOf(0.01),
    currency: z.currency()
})

export type RequestBody = zod.infer<typeof RequestSchema>