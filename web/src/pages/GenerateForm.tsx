import { useState, type FormEvent } from "react";
import type { DifficultyPreference, FrequencyPreference, SelectionContext } from "../api/types.ts";
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

  function addTag() {
    const next = TAG_OPTIONS.find((tag) => !tagIds.includes(tag.id));
    if (!next) return;
    setTagIds([...tagIds, next.id]);
  }

  function changeTag(index: number, id: string) {
    setTagIds(tagIds.map((current, i) => (i === index ? id : current)));
  }

  function removeTag(index: number) {
    setTagIds(tagIds.filter((_, i) => i !== index));
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

  const unusedTagCount = TAG_OPTIONS.filter((tag) => !tagIds.includes(tag.id)).length;

  return (
    <form onSubmit={handleSubmit}>
      <OptionBoxes
        legend="Activity"
        name="activity"
        value={activity}
        options={ACTIVITY_OPTIONS.map((value) => ({ value, label: value }))}
        onChange={setActivity}
      />
      <OptionBoxes
        legend="Vocabulary scope"
        name="vocabularyScope"
        value={vocabularyScope}
        options={SCOPE_OPTIONS.map((value) => ({ value, label: value }))}
        onChange={setVocabularyScope}
      />
      <OptionBoxes
        legend="Grade"
        name="grade"
        value={String(grade)}
        options={GRADE_OPTIONS.map((value) => ({ value: String(value), label: String(value) }))}
        onChange={(value) => setGrade(Number(value) as (typeof GRADE_OPTIONS)[number])}
      />
      <OptionBoxes
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

      <fieldset className="field">
        <legend>Count</legend>
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(event) => setCount(Number(event.target.value))}
        />
      </fieldset>

      <OptionBoxes
        legend="Difficulty"
        name="difficulty"
        value={difficultyPreference}
        options={DIFFICULTY_OPTIONS.map((value) => ({ value, label: value }))}
        onChange={setDifficultyPreference}
      />
      <OptionBoxes
        legend="Frequency"
        name="frequency"
        value={frequencyPreference}
        options={FREQUENCY_OPTIONS.map((value) => ({ value, label: value }))}
        onChange={setFrequencyPreference}
      />

      <fieldset className="field">
        <legend>Tags</legend>
        {tagIds.length === 0 ? <p className="hint">No tags added.</p> : null}
        {tagIds.map((tagId, index) => (
          <div className="tag-row" key={`${tagId}-${index}`}>
            <select value={tagId} onChange={(event) => changeTag(index, event.target.value)}>
              {TAG_OPTIONS.filter((tag) => tag.id === tagId || !tagIds.includes(tag.id)).map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => removeTag(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addTag} disabled={unusedTagCount === 0}>
          Add tag
        </button>
      </fieldset>

      {error ? <p className="error">{error}</p> : null}
      <button type="submit" disabled={submitting}>
        {submitting ? "Generating…" : "Generate words"}
      </button>
    </form>
  );
}

type OptionBoxesProps<T extends string> = {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

function OptionBoxes<T extends string>({ legend, name, value, options, onChange }: OptionBoxesProps<T>) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="option-row">
        {options.map((option) => (
          <label key={option.value} className="option-box">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
