import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
mkdirSync(dir, { recursive: true });
const now = "2026-10-03T00:00:00.000Z";
const scopeType = "人教版";

const features = [
  { id: "feat-changkao", name: "常考词", type: "tag" },
  { id: "feat-shengpi", name: "生僻词", type: "tag" },
  { id: "feat-writing", name: "写作词汇", type: "tag" },
  { id: "feat-topic-animals", name: "animals", type: "tag" },
  { id: "feat-topic-school", name: "school", type: "tag" },
  { id: "feat-topic-environment", name: "environment", type: "tag" },
  { id: "feat-topic-family", name: "family", type: "tag" },
  { id: "feat-topic-food", name: "food", type: "tag" },
  { id: "feat-frequency", name: "frequency", type: "score" },
  { id: "feat-difficulty", name: "difficulty", type: "score" },
];

/** @type {{ lemma: string, length: number, syllableCount: number, grade: string, tags: string[] }[]} */
const raw = [
  { lemma: "cat", length: 3, syllableCount: 1, grade: "Grade 1", tags: ["feat-changkao", "feat-topic-animals"] },
  { lemma: "dog", length: 3, syllableCount: 1, grade: "Grade 1", tags: ["feat-changkao", "feat-topic-animals"] },
  { lemma: "red", length: 3, syllableCount: 1, grade: "Grade 1", tags: ["feat-changkao"] },
  { lemma: "book", length: 4, syllableCount: 1, grade: "Grade 1", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "bag", length: 3, syllableCount: 1, grade: "Grade 1", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "apple", length: 5, syllableCount: 2, grade: "Grade 1", tags: ["feat-changkao", "feat-topic-food"] },
  { lemma: "milk", length: 4, syllableCount: 1, grade: "Grade 1", tags: ["feat-changkao", "feat-topic-food"] },
  { lemma: "mum", length: 3, syllableCount: 1, grade: "Grade 1", tags: ["feat-changkao", "feat-topic-family"] },

  { lemma: "school", length: 6, syllableCount: 1, grade: "Grade 2", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "happy", length: 5, syllableCount: 2, grade: "Grade 2", tags: ["feat-changkao", "feat-topic-family"] },
  { lemma: "water", length: 5, syllableCount: 2, grade: "Grade 2", tags: ["feat-changkao", "feat-topic-food"] },
  { lemma: "friend", length: 6, syllableCount: 1, grade: "Grade 2", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "small", length: 5, syllableCount: 1, grade: "Grade 2", tags: ["feat-changkao", "feat-topic-animals"] },
  { lemma: "green", length: 5, syllableCount: 1, grade: "Grade 2", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "stand", length: 5, syllableCount: 1, grade: "Grade 2", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "under", length: 5, syllableCount: 2, grade: "Grade 2", tags: ["feat-shengpi"] },

  { lemma: "animal", length: 6, syllableCount: 3, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-animals"] },
  { lemma: "tiger", length: 5, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-animals"] },
  { lemma: "panda", length: 5, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-animals"] },
  { lemma: "rabbit", length: 6, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-animals"] },
  { lemma: "monkey", length: 6, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-animals"] },
  { lemma: "elephant", length: 8, syllableCount: 3, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-animals", "feat-writing"] },
  { lemma: "river", length: 5, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "plant", length: 5, syllableCount: 1, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "forest", length: 6, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "garden", length: 6, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "weather", length: 7, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao"] },
  { lemma: "cloudy", length: 6, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao"] },
  { lemma: "teacher", length: 7, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "window", length: 6, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "lunch", length: 5, syllableCount: 1, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-food"] },
  { lemma: "family", length: 6, syllableCount: 3, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-family"] },
  { lemma: "picnic", length: 6, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-food", "feat-topic-family"] },
  { lemma: "weekend", length: 7, syllableCount: 2, grade: "Grade 3", tags: ["feat-changkao", "feat-topic-family"] },
  { lemma: "hobby", length: 5, syllableCount: 2, grade: "Grade 3", tags: ["feat-shengpi"] },
  { lemma: "recycle", length: 7, syllableCount: 3, grade: "Grade 3", tags: ["feat-shengpi", "feat-topic-environment"] },

  { lemma: "village", length: 7, syllableCount: 2, grade: "Grade 4", tags: ["feat-changkao"] },
  { lemma: "museum", length: 6, syllableCount: 3, grade: "Grade 4", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "library", length: 7, syllableCount: 3, grade: "Grade 4", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "healthy", length: 7, syllableCount: 2, grade: "Grade 4", tags: ["feat-changkao", "feat-topic-food"] },
  { lemma: "vegetable", length: 9, syllableCount: 4, grade: "Grade 4", tags: ["feat-changkao", "feat-topic-food"] },
  { lemma: "favourite", length: 9, syllableCount: 3, grade: "Grade 4", tags: ["feat-changkao", "feat-writing"] },
  { lemma: "countryside", length: 11, syllableCount: 3, grade: "Grade 4", tags: ["feat-shengpi", "feat-topic-environment"] },
  { lemma: "birthday", length: 8, syllableCount: 2, grade: "Grade 4", tags: ["feat-changkao", "feat-topic-family"] },
  { lemma: "season", length: 6, syllableCount: 2, grade: "Grade 4", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "clothes", length: 7, syllableCount: 1, grade: "Grade 4", tags: ["feat-changkao"] },

  { lemma: "pollution", length: 9, syllableCount: 3, grade: "Grade 5", tags: ["feat-changkao", "feat-topic-environment", "feat-writing"] },
  { lemma: "environment", length: 11, syllableCount: 4, grade: "Grade 5", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "protect", length: 7, syllableCount: 2, grade: "Grade 5", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "nature", length: 6, syllableCount: 2, grade: "Grade 5", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "plastic", length: 7, syllableCount: 2, grade: "Grade 5", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "energy", length: 6, syllableCount: 3, grade: "Grade 5", tags: ["feat-changkao"] },
  { lemma: "earth", length: 5, syllableCount: 1, grade: "Grade 5", tags: ["feat-changkao", "feat-topic-environment"] },
  { lemma: "dirty", length: 5, syllableCount: 2, grade: "Grade 5", tags: ["feat-changkao"] },
  { lemma: "clean", length: 5, syllableCount: 1, grade: "Grade 5", tags: ["feat-changkao"] },
  { lemma: "habitat", length: 7, syllableCount: 3, grade: "Grade 5", tags: ["feat-shengpi", "feat-topic-animals"] },

  { lemma: "beautiful", length: 9, syllableCount: 3, grade: "Grade 6", tags: ["feat-changkao", "feat-writing"] },
  { lemma: "important", length: 9, syllableCount: 3, grade: "Grade 6", tags: ["feat-changkao", "feat-writing"] },
  { lemma: "information", length: 11, syllableCount: 4, grade: "Grade 6", tags: ["feat-changkao", "feat-topic-school"] },
  { lemma: "different", length: 9, syllableCount: 3, grade: "Grade 6", tags: ["feat-changkao"] },
  { lemma: "together", length: 8, syllableCount: 3, grade: "Grade 6", tags: ["feat-changkao", "feat-topic-family"] },
  { lemma: "discover", length: 8, syllableCount: 3, grade: "Grade 6", tags: ["feat-changkao"] },
  { lemma: "invention", length: 9, syllableCount: 3, grade: "Grade 6", tags: ["feat-shengpi", "feat-topic-school"] },
  { lemma: "scientist", length: 9, syllableCount: 3, grade: "Grade 6", tags: ["feat-changkao", "feat-topic-school"] },
];

const words = raw.map((w) => ({
  id: `word-${w.lemma}`,
  lemma: w.lemma,
  vocabularyScope: scopeType,
  grade: Number(String(w.grade).replace("Grade ", "")),
  term: null,
  phoneticSymbols: "",
  source: "LLM",
  syllableCount: w.syllableCount,
  createdAt: now,
  _tags: w.tags,
}));

const wordFeatures = [];
let wf = 1;
for (const w of words) {
  for (const featureId of w._tags) {
    wordFeatures.push({
      id: `wf-${wf++}`,
      wordId: w.id,
      featureId,
      value: null,
      vocabularyScope: scopeType,
      source: "LLM",
      sourceVersion: "seed-v1",
      createdAt: now,
    });
  }
}

const strategies = [
  {
    id: "RULE_VDEMO",
    name: "Rule-based demo ranker",
    version: "1",
    description:
      "Hard filter by Word.vocabularyScope and grade/term; contextFit from tag match plus optional difficulty and frequency preferences.",
  },
];

const cleanWords = words.map(
  ({ id, lemma, vocabularyScope, grade, term, phoneticSymbols, source, syllableCount, createdAt }) => ({
    id,
    lemma,
    vocabularyScope,
    grade,
    term,
    phoneticSymbols,
    source,
    syllableCount,
    createdAt,
  }),
);

writeFileSync(join(dir, "words.json"), JSON.stringify(cleanWords, null, 2));
writeFileSync(join(dir, "features.json"), JSON.stringify(features, null, 2));
writeFileSync(join(dir, "word-features.json"), JSON.stringify(wordFeatures, null, 2));
writeFileSync(join(dir, "word-ch-translations.json"), JSON.stringify([], null, 2));
writeFileSync(join(dir, "selection-strategies.json"), JSON.stringify(strategies, null, 2));
writeFileSync(join(dir, "selection-events.json"), JSON.stringify([], null, 2));

console.log(`Wrote ${cleanWords.length} words, ${wordFeatures.length} word-features.`);
