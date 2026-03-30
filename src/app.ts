import express, { Application } from "express";
import { router } from "./route.ts";

export const app: Application = express();

app.use(express.json());
app.use("", router);
