import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { reportRoutes } from "./routes/reportRoutes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendOrigin
    })
  );
  app.use(express.json());

  app.use("/api", reportRoutes);
  app.use(errorHandler);

  return app;
}
