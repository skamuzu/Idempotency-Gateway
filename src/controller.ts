import { Request, Response, RequestHandler } from "express";
import { RequestBody } from "./types.ts";

export const processPayment: RequestHandler = (req: Request, res: Response) => {
  const body: RequestBody = req.body;
  return res.setTimeout(2000, () => {
    res.status(200).json({
      success: true,
      message: `Charged ${body.amount} ${body.currency}`,
    });
  });
};
