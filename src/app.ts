import express, { Application } from "express";
import { router } from "./route.js";

export const app: Application = express();

app.use(express.json());
app.use("", router);
