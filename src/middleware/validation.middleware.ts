import { RequestHandler, Response, NextFunction, Request } from "express";
import { ZodType } from "zod";
import * as z from "zod";

export const validateSchema = <T extends ZodType>(
  schema: T,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validationResult.error.message,
      });
      return;
    }

    req.body = validationResult.data as z.infer<T>;
    next();
  };
};
