import { useState, type FormEvent } from "react";
import type { DifficultyPreference, FrequencyPreference, SelectionContext } from "../api/types.ts";
import { Icon } from "../components/Icon.tsx";
import {
  ACTIVITY_OPTIONS,
  DIFFICULTY_OPTIONS,
  FREQUENCY_OPTIONS,
  GRADE_OPTIONS,
  SCOPE_OPTIONS,
  TAG_OPTIONS,
  TERM_OPTIONS,
} from "./generateOptions.ts";

type GenerateFormProps = {
  submitting: boolean;
  error: string | null;
  onSubmit: (context: SelectionContext) => void;
};

const LABELS: Record<string, string> = {
  dictation: "Dictation",
  mixed: "Mixed",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  high: "High",
  low: "Low",
};

function labelFor(value: string) {
  return LABELS[value] ?? value;
}

function termKey(term: 1 | 2 | null): string {
  return term == null ? "full" : String(term);
}

export function GenerateForm({ submitting, error, onSubmit }: GenerateFormProps) {
  const [activity, setActivity] = useState<(typeof ACTIVITY_OPTIONS)[number]>("dictation");
  const [vocabularyScope, setVocabularyScope] = useState<(typeof SCOPE_OPTIONS)[number]>("PEP");
  const [grade, setGrade] = useState<(typeof GRADE_OPTIONS)[number]>(3);
  const [term, setTerm] = useState<1 | 2 | null>(null);
  const [count, setCount] = useState(10);
  const [difficultyPreference, setDifficultyPreference] = useState<DifficultyPreference>("mixed");
  const [frequencyPreference, setFrequencyPreference] = useState<FrequencyPreference>("high");
  const [tagIds, setTagIds] = useState<string[]>([]);

  function toggleTag(id: string) {
    setTagIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const level = { grade, term };
    onSubmit({
      vocabularyScope,
      levelRange: { from: level, to: level },
      activity,
      count,
      preferredFeatureIds: tagIds,
      difficultyPreference,
      frequencyPreference,
    });
  }

  const wordCount = Number.isFinite(count) && count > 0 ? count : null;

  return (
    <form className="configure-form" onSubmit={handleSubmit}>
      <div className="learner-strip">
        <span className="learner-badge" aria-hidden="true">
          SL
        </span>
        <div>
          <small>Learner</small>
          <strong>Sample learner</strong>
        </div>
        <span className="learner-pill">Placeholder profile</span>
      </div>
      <div className="configure-grid">
        <ChipGroup
          legend="Activity"
          name="activity"
          value={activity}
          options={ACTIVITY_OPTIONS.map((value) => ({ value, label: labelFor(value) }))}
          onChange={setActivity}
        />
        <ChipGroup
          legend="Vocabulary scope"
          name="vocabularyScope"
          value={vocabularyScope}
          options={SCOPE_OPTIONS.map((value) => ({ value, label: value }))}
          onChange={setVocabularyScope}
        />
        <ChipGroup
          legend="Grade"
          name="grade"
          value={String(grade)}
          options={GRADE_OPTIONS.map((value) => ({ value: String(value), label: String(value) }))}
          onChange={(value) => setGrade(Number(value) as (typeof GRADE_OPTIONS)[number])}
        />
        <ChipGroup
          legend="Term"
          name="term"
          value={termKey(term)}
          options={TERM_OPTIONS.map((option) => ({ value: termKey(option.term), label: option.label }))}
          onChange={(value) => {
            if (value === "1") setTerm(1);
            else if (value === "2") setTerm(2);
            else setTerm(null);
          }}
        />
        <ChipGroup
          legend="Difficulty"
          name="difficulty"
          value={difficultyPreference}
          options={DIFFICULTY_OPTIONS.map((value) => ({ value, label: labelFor(value) }))}
          onChange={setDifficultyPreference}
        />
        <ChipGroup
          legend="Frequency"
          name="frequency"
          value={frequencyPreference}
          options={FREQUENCY_OPTIONS.map((value) => ({ value, label: labelFor(value) }))}
          onChange={setFrequencyPreference}
        />
        <fieldset className="field">
          <legend>Count</legend>
          <input
            className="count-input"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </fieldset>
        <fieldset className="field configure-tags">
          <legend>
            Tags <small>Optional</small>
          </legend>
          <div className="chip-row">
            {TAG_OPTIONS.map((tag) => {
              const selected = tagIds.includes(tag.id);
              return (
                <label key={tag.id} className={`chip ${selected ? "chip-selected" : ""}`}>
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag.id}
                    checked={selected}
                    onChange={() => toggleTag(tag.id)}
                  />
                  {tag.name}
                  {selected ? <Icon name="check" size={14} /> : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
      {error ? <p className="error configure-error">{error}</p> : null}
      <div className="configure-footer">
        <span className="configure-ready">
          <Icon name="spark" size={16} />
          {wordCount ? `Ready to generate ${wordCount} words` : "Ready to generate a word list"}
        </span>
        <button className="generate-action" type="submit" disabled={submitting}>
          {submitting ? "Generating…" : "Generate Dictation List"}
        </button>
      </div>
    </form>
  );
}

type ChipGroupProps<T extends string> = {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

function ChipGroup<T extends string>({ legend, name, value, options, onChange }: ChipGroupProps<T>) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="chip-row">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label key={option.value} className={`chip ${selected ? "chip-selected" : ""}`}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              {option.label}
              {selected ? <Icon name="check" size={14} /> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
