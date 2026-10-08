import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { selectionRouter } from "./routes/selections.js";
import { errorHandler } from "./controllers/selectionController.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, strategyId: config.strategyId, strategyVersion: config.strategyVersion });
});

app.use("/api/selections", selectionRouter);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Vocabulary Selection API listening on http://localhost:${config.port}`);
});
