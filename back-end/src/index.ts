import express from "express";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = express();
app.disable("x-powered-by");
app.use(createApp(env));

export default app;

if (!process.env.VERCEL) {
  app.listen(env.PORT);
}