import { createHash } from "crypto";
import { Response } from "express";

type CachedResponse = {
    statusCode: number;
    body: unknown;
    headers: Record<string, string | number | string[] | undefined>;
};

export function hashRequest(body:any): string {
    const content = JSON.stringify(body) || '';
    return createHash("sha256").update(content).digest("hex")
}

export function replayCachedResponse(
    res: Response,
    response: CachedResponse,
): Response {
    res.set("X-Cache-Hit", "true");

    for (const [key, value] of Object.entries(response.headers)) {
        if (value === undefined) {
            continue;
        }

        if (Array.isArray(value)) {
            res.set(key, value);
            continue;
        }

        res.set(key, String(value));
    }

    return res.status(response.statusCode).json(response.body);
}