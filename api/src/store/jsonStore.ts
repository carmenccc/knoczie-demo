import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Feature,
  SelectionEvent,
  Word,
  WordChTranslation,
  WordFeature,
  WordPool,
} from "../models/types.js";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data");

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(dataDir, name), "utf8")) as T;
}

export function loadPool(): WordPool {
  return {
    words: readJson<Word[]>("words.json"),
    features: readJson<Feature[]>("features.json"),
    wordFeatures: readJson<WordFeature[]>("word-features.json"),
    wordChTranslations: readJson<WordChTranslation[]>("word-ch-translations.json"),
  };
}

export function appendEvent(event: SelectionEvent): void {
  const path = join(dataDir, "selection-events.json");
  const events = JSON.parse(readFileSync(path, "utf8")) as SelectionEvent[];
  events.push(event);
  writeFileSync(path, JSON.stringify(events, null, 2));
}
