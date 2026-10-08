import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError.js";
import * as selectionService from "../services/selectionService.js";

export function createSelection(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(selectionService.createSelection(req.body));
  } catch (err) {
    next(err);
  }
}

export function getSelection(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(selectionService.getSelection(req.params.id));
  } catch (err) {
    next(err);
  }
}

export function applyAction(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(selectionService.applyAction(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export function commitSelection(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json({ event: selectionService.commitSelection(req.params.id) });
  } catch (err) {
    next(err);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
}
