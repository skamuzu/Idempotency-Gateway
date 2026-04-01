import currencyCodes from "currency-codes";
import * as zod from "zod"

const isValidCurrencyCode = (code: string): boolean => Boolean(currencyCodes.code(code));

export const RequestSchema = zod.object({
    amount: zod.number().multipleOf(0.01),
    currency: zod
        .string()
        .trim()
        .transform((value) => value.toUpperCase())
        .refine(isValidCurrencyCode, {
            message: "Invalid ISO 4217 currency code"
        })
})

export type RequestBody = zod.infer<typeof RequestSchema>