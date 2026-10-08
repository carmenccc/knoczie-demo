"""Extract features.json and word-features.json from parsed words.csv + words.json."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from raw_linxueyuan import (
    CREATED_AT,
    DATA_DIR,
    SCORE_FEATURES,
    SOURCE,
    SOURCE_VERSION,
    TAG_FEATURES,
    load_json,
    parsed_word_rows,
    word_feature_id_for,
    word_id_for,
    write_json,
)


def main() -> int:
    words_path = DATA_DIR / "words.json"
    if not words_path.exists():
        print("error: run extract_words.py first (missing data/words.json)", file=sys.stderr)
        return 1

    emitted_ids = {row["id"] for row in load_json(words_path)}
    parsed, warnings = parsed_word_rows()
    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)

    features = [*TAG_FEATURES, *SCORE_FEATURES]
    word_features = []
    for row in parsed:
        word_id = word_id_for(row["lemma"])
        if word_id not in emitted_ids:
            continue
        for feature_id, value in (
            ("feat-frequency", row["frequency"]),
            ("feat-difficulty", row["difficulty"]),
        ):
            word_features.append(
                {
                    "id": word_feature_id_for(word_id, feature_id),
                    "wordId": word_id,
                    "featureId": feature_id,
                    "value": value,
                    "vocabularyScope": row["vocabularyScope"],
                    "grade": row["grade"],
                    "term": row["term"],
                    "source": SOURCE,
                    "sourceVersion": SOURCE_VERSION,
                    "createdAt": CREATED_AT,
                }
            )

    features_path = DATA_DIR / "features.json"
    word_features_path = DATA_DIR / "word-features.json"
    write_json(features_path, features)
    write_json(word_features_path, word_features)
    print(f"wrote {len(features)} features → {features_path}")
    print(f"wrote {len(word_features)} word-features → {word_features_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
