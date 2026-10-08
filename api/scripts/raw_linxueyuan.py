"""Shared helpers for LinXueyuanStdio CSV → JSON dummy extractors."""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

# TODO: refine id generation logic (stable ids, collision handling, punctuation).

CREATED_AT = "2026-10-07T00:00:00.000Z"
SOURCE = "LinXueyuanStdio"
SOURCE_VERSION = "raw-v1"
VOCABULARY_SCOPE = "人教版"

SCRIPTS_DIR = Path(__file__).resolve().parent
API_DIR = SCRIPTS_DIR.parent
RAW_DIR = API_DIR / "data" / "raw" / "source_LinXueyuanStdio"
DATA_DIR = API_DIR / "data"
WORDS_CSV = RAW_DIR / "words.csv"
TRANSLATIONS_CSV = RAW_DIR / "word_translations.csv"
SYLLABLE_CACHE_PATH = RAW_DIR / "syllable_cache.json"

GRADE_CN = {"三": 3, "四": 4, "五": 5, "六": 6, "3": 3, "4": 4, "5": 5, "6": 6}
TERM_CN = {"上": 1, "下": 2}

# Longer tags first so adj. / adv. / vt. / vi. win over n. / v. / a.
POS_PATTERN = re.compile(
    r"(?i)(adj\.|adv\.|prep\.|conj\.|pron\.|num\.|art\.|int\.|aux\.|phr\.|vt\.|vi\.|n\.|v\.)"
)

TAG_FEATURES = [
    {"id": "feat-changkao", "name": "常考词", "type": "tag"},
    {"id": "feat-shengpi", "name": "生僻词", "type": "tag"},
    {"id": "feat-writing", "name": "写作词汇", "type": "tag"},
    {"id": "feat-topic-animals", "name": "animals", "type": "tag"},
    {"id": "feat-topic-school", "name": "school", "type": "tag"},
    {"id": "feat-topic-environment", "name": "environment", "type": "tag"},
    {"id": "feat-topic-family", "name": "family", "type": "tag"},
    {"id": "feat-topic-food", "name": "food", "type": "tag"},
]

SCORE_FEATURES = [
    {"id": "feat-frequency", "name": "frequency", "type": "score"},
    {"id": "feat-difficulty", "name": "difficulty", "type": "score"},
]


def lemma_slug(lemma: str) -> str:
    return lemma.strip().replace(" ", "_")


def word_id_for(lemma: str) -> str:
    # TODO: refine id generation logic
    return f"word_{lemma_slug(lemma)}"


def translation_id_for(lemma: str) -> str:
    # TODO: refine id generation logic
    return f"tr_{lemma_slug(lemma)}"


def word_feature_id_for(word_id: str, feature_id: str) -> str:
    # TODO: refine id generation logic
    return f"wf_{word_id}_{feature_id}"


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_bk_id_name(raw: str) -> dict[str, Any] | None:
    """First `|` segment only. Grade is `{N}年级` after dropping `三年级起点`."""
    if not raw or not raw.strip():
        return None
    first = raw.split("|", 1)[0].strip()
    parts = first.split(None, 1)
    if len(parts) < 2:
        return None
    label = parts[1]
    cleaned = label.replace("三年级起点", "")
    match = re.search(r"([3-6三四56五六])年级([上下])", cleaned)
    if match is None:
        return None
    grade = GRADE_CN.get(match.group(1))
    term = TERM_CN.get(match.group(2))
    if grade is None or term is None:
        return None
    if "人教版" not in label:
        return None
    return {
        "vocabularyScope": VOCABULARY_SCOPE,
        "grade": grade,
        "term": term,
    }


def read_words_csv() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with WORDS_CSV.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=">")
        for row in reader:
            rows.append({key: (value or "").strip() for key, value in row.items()})
    return rows


def parsed_word_rows() -> tuple[list[dict[str, Any]], list[str]]:
    """Return parsed lexical rows plus skip warnings."""
    parsed: list[dict[str, Any]] = []
    warnings: list[str] = []
    for row in read_words_csv():
        lemma = row.get("vc_vocabulary", "").strip()
        book = row.get("bk_id_name", "").strip()
        if not lemma:
            warnings.append(f"skip empty lemma vc_id={row.get('vc_id', '')}")
            continue
        book_fields = parse_bk_id_name(book)
        if book_fields is None:
            warnings.append(f"skip unparseable bk_id_name for {lemma!r}: {book!r}")
            continue
        try:
            frequency = float(row.get("vc_frequency") or "nan")
            difficulty_raw = float(row.get("vc_difficulty") or "nan")
        except ValueError:
            warnings.append(f"skip non-numeric frequency/difficulty for {lemma!r}")
            continue
        parsed.append(
            {
                "lemma": lemma,
                "phoneticSymbols": row.get("vc_phonetic_uk", ""),
                "frequency": frequency,
                "difficulty": difficulty_raw / 10.0,
                **book_fields,
            }
        )
    return parsed, warnings


def _is_cjk(char: str) -> bool:
    return "\u4e00" <= char <= "\u9fff"


def _is_stacked_pos(text: str, pos_start: int) -> bool:
    last = None
    for match in POS_PATTERN.finditer(text[:pos_start]):
        last = match
    if last is None:
        return False
    between = text[last.end() : pos_start]
    return between.strip() == ""


def split_ch_translations(raw: str) -> str:
    """Split POS-tagged Chinese senses onto `|`. Keep stacked POS tags in one chunk."""
    text = (raw or "").strip()
    if not text:
        return ""

    starts: list[int] = []
    for match in POS_PATTERN.finditer(text):
        index = match.start()
        if _is_stacked_pos(text, index):
            continue
        cursor = index - 1
        while cursor >= 0 and text[cursor] in " \t":
            cursor -= 1
        if cursor < 0:
            starts.append(index)
            continue
        prev = text[cursor]
        if prev in ";；/" or _is_cjk(prev):
            starts.append(index)
            continue
        prefix = text[:index].strip()
        if prefix == "":
            starts.append(index)

    if not starts:
        return re.sub(r"\s+", " ", text).strip()

    chunks: list[str] = []
    prefix = text[: starts[0]].strip(" \t;；/")
    if prefix:
        chunks.append(prefix)
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(text)
        chunk = text[start:end].strip(" \t;；/")
        if chunk:
            chunks.append(chunk)
    return "|".join(re.sub(r"\s+", " ", chunk).strip() for chunk in chunks)


def read_translations_csv() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with TRANSLATIONS_CSV.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append({key: (value or "").strip() for key, value in row.items()})
    return rows
