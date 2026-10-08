import { Router } from "express";
import * as selectionController from "../controllers/selectionController.js";

export const selectionRouter = Router();

selectionRouter.post("/", selectionController.createSelection);
selectionRouter.get("/:id", selectionController.getSelection);
selectionRouter.post("/:id/actions", selectionController.applyAction);
selectionRouter.post("/:id/commit", selectionController.commitSelection);
