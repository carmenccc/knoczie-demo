"""Extract api/data/words.json from LinXueyuanStdio words.csv."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from raw_linxueyuan import (
    CREATED_AT,
    DATA_DIR,
    SOURCE,
    SYLLABLE_CACHE_PATH,
    load_json,
    parsed_word_rows,
    word_id_for,
    write_json,
)

GEMINI_MODELS = (
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-lite-latest",
)
BATCH_SIZE = 80
RETRY_SLEEP_SEC = 2.0


def _gemini_key(cli_key: str | None) -> str:
    return (cli_key or os.environ.get("GEMINI_API_KEY") or "").strip()


def _load_syllable_cache() -> dict[str, int]:
    if not SYLLABLE_CACHE_PATH.exists():
        return {}
    raw = load_json(SYLLABLE_CACHE_PATH)
    if not isinstance(raw, dict):
        return {}
    out: dict[str, int] = {}
    for lemma, count in raw.items():
        try:
            out[str(lemma)] = int(count)
        except (TypeError, ValueError):
            continue
    return out


def _save_syllable_cache(cache: dict[str, int]) -> None:
    write_json(SYLLABLE_CACHE_PATH, dict(sorted(cache.items())))


def _extract_json_object(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json\n", "", 1).replace("JSON\n", "", 1)
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start < 0 or end < 0 or end <= start:
        raise ValueError("Gemini response had no JSON object")
    payload = json.loads(cleaned[start : end + 1])
    if not isinstance(payload, dict):
        raise ValueError("Gemini JSON was not an object")
    return payload


def _call_gemini(api_key: str, model: str, lemmas: list[str]) -> dict[str, int]:
    prompt = (
        "Count spoken English syllables for each elementary EFL headword or short phrase.\n"
        "Return ONLY a JSON object mapping each exact lemma string to an integer.\n"
        "Examples: cat=1, apple=2, elephant=3, dining hall=3, cleaned=1, Canada=3, storybook=3.\n"
        "Lemmas:\n"
        + "\n".join(f"- {lemma}" for lemma in lemmas)
    )
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0,
            "responseMimeType": "application/json",
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))
    text = payload["candidates"][0]["content"]["parts"][0]["text"]
    parsed = _extract_json_object(text)
    counts: dict[str, int] = {}
    for lemma, value in parsed.items():
        try:
            count = int(value)
        except (TypeError, ValueError):
            continue
        if count < 1:
            continue
        counts[str(lemma)] = count
    return counts


def fill_syllable_counts(lemmas: list[str], api_key: str) -> dict[str, int]:
    cache = _load_syllable_cache()
    missing = [lemma for lemma in lemmas if lemma not in cache]
    if not missing:
        print(f"syllableCount: cache hit for all {len(lemmas)} lemmas")
        return cache
    if not api_key:
        print(
            "syllableCount: GEMINI_API_KEY missing; unmatched lemmas stay 0",
            file=sys.stderr,
        )
        return cache

    print(f"syllableCount: {len(missing)} lemmas need Gemini ({len(cache)} cached)")
    last_error: str | None = None
    for offset in range(0, len(missing), BATCH_SIZE):
        batch = missing[offset : offset + BATCH_SIZE]
        filled = False
        for model in GEMINI_MODELS:
            try:
                counts = _call_gemini(api_key, model, batch)
                cache.update(counts)
                _save_syllable_cache(cache)
                print(
                    f"  batch {offset // BATCH_SIZE + 1}: {len(counts)}/{len(batch)} via {model}"
                )
                filled = True
                break
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="replace")[:240]
                last_error = f"{model} HTTP {exc.code} {detail}"
            except (urllib.error.URLError, KeyError, ValueError, json.JSONDecodeError) as exc:
                last_error = f"{model} {exc}"
            time.sleep(RETRY_SLEEP_SEC)
        if not filled:
            print(f"  batch failed: {last_error}", file=sys.stderr)
        time.sleep(0.4)
    still_missing = [lemma for lemma in missing if lemma not in cache]
    if still_missing:
        print(
            f"syllableCount: {len(still_missing)} lemmas left at 0 (Gemini miss)",
            file=sys.stderr,
        )
    return cache


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract words.json from words.csv")
    parser.add_argument(
        "--api-key",
        default=None,
        help="Gemini API key (else GEMINI_API_KEY). Do not commit keys.",
    )
    args = parser.parse_args()

    parsed, warnings = parsed_word_rows()
    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)

    lemmas = [row["lemma"] for row in parsed]
    counts = fill_syllable_counts(lemmas, _gemini_key(args.api_key))

    words = []
    for row in parsed:
        words.append(
            {
                "id": word_id_for(row["lemma"]),
                "lemma": row["lemma"],
                "vocabularyScope": row["vocabularyScope"],
                "grade": row["grade"],
                "term": row["term"],
                "phoneticSymbols": row["phoneticSymbols"],
                "source": SOURCE,
                "syllableCount": int(counts.get(row["lemma"], 0)),
                "createdAt": CREATED_AT,
            }
        )

    out_path = DATA_DIR / "words.json"
    write_json(out_path, words)
    zeroed = sum(1 for word in words if word["syllableCount"] == 0)
    print(f"wrote {len(words)} words → {out_path} ({zeroed} syllableCount=0)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
