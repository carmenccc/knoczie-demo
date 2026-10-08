"""Extract api/data/word-ch-translations.json from word_translations.csv."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from raw_linxueyuan import (
    DATA_DIR,
    read_translations_csv,
    split_ch_translations,
    translation_id_for,
    write_json,
)


def main() -> int:
    records = []
    skipped = 0
    for row in read_translations_csv():
        lemma = (row.get("word") or "").strip()
        raw = row.get("translation") or ""
        if not lemma:
            skipped += 1
            continue
        records.append(
            {
                "id": translation_id_for(lemma),
                "wordLemma": lemma,
                "chTranslations": split_ch_translations(raw),
            }
        )

    out_path = DATA_DIR / "word-ch-translations.json"
    write_json(out_path, records)
    if skipped:
        print(f"warning: skipped {skipped} rows with empty word", file=sys.stderr)
    print(f"wrote {len(records)} translations → {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
