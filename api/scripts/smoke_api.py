"""HTTP smoke checks against a running Vocabulary Selection API."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
failures: list[str] = []


def request(method: str, path: str, body: dict | None = None) -> tuple[int, dict | list | str]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            payload = json.loads(raw) if raw else {}
            return resp.status, payload
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = raw
        return exc.code, payload


def expect(ok: bool, message: str) -> None:
    prefix = "PASS" if ok else "FAIL"
    print(f"{prefix}: {message}")
    if not ok:
        failures.append(message)


def main() -> int:
    status, health = request("GET", "/api/health")
    expect(status == 200 and health.get("ok") is True, f"GET /api/health → {status} {health}")
    expect(health.get("strategyId") == "RULE_VDEMO", "health reports RULE_VDEMO")

    create_body = {
        "vocabularyScope": "PEP",
        "levelRange": {
            "from": {"grade": 3, "term": None},
            "to": {"grade": 3, "term": None},
        },
        "activity": "dictation",
        "count": 10,
        "preferredFeatureIds": ["feat-changkao"],
        "difficultyPreference": "easy",
        "frequencyPreference": "high",
    }
    status, session = request("POST", "/api/selections", create_body)
    expect(status == 201, f"POST /api/selections → {status}")
    sid = session.get("id") if isinstance(session, dict) else None
    candidates = session.get("candidates", []) if isinstance(session, dict) else []
    expect(isinstance(sid, str) and str(sid).startswith("sel_"), f"session id {sid}")
    expect(len(candidates) == 10, f"visible count {len(candidates)}")
    rec = session.get("recommendedWords") if isinstance(session, dict) else None
    other = session.get("otherWords") if isinstance(session, dict) else None
    used = session.get("usedWords") if isinstance(session, dict) else None
    expect(isinstance(rec, list) and isinstance(other, list), "leftover pools present")
    expect(len(rec or []) == 10, f"leftover recommended size {len(rec or [])} (R=20, visible=10)")
    expect(len(other or []) > 0, "otherWords holds remaining eligible words")
    expect("bufferCount" not in session, "bufferCount removed from response")
    visible_ids = {c["wordId"] for c in candidates}
    leftover_ids = {c["wordId"] for c in (rec or [])} | {c["wordId"] for c in (other or [])}
    expect(visible_ids.isdisjoint(leftover_ids), "visible words are not still in leftover pools")
    expect(set(used or []) == visible_ids, f"usedWords starts as visible ids")
    expect(session.get("selectionContext", {}).get("vocabularyScope") == "人教版", "PEP aliases 人教版")

    reasons = " ".join(candidates[0].get("reasons", [])) if candidates else ""
    expect("difficulty:explicit:" in reasons, f"uses extracted difficulty scores: {reasons[:180]}")
    expect("frequency:" in reasons and "frequency:missing" not in reasons, "uses extracted frequency scores")
    expect("tag:miss:feat-changkao" in reasons, "tag catalog still validates; no tag WordFeatures yet")

    status, fetched = request("GET", f"/api/selections/{sid}")
    expect(status == 200 and fetched.get("id") == sid, "GET session by id")

    word_id = candidates[0]["wordId"]
    status, after_keep = request("POST", f"/api/selections/{sid}/actions", {"type": "keep", "wordId": word_id})
    expect(status == 200, f"keep → {status}")
    expect(after_keep.get("candidates", [{}])[0].get("wordId") == word_id, "keep leaves first word")

    remove_id = after_keep["candidates"][1]["wordId"]
    status, after_remove = request(
        "POST",
        f"/api/selections/{sid}/actions",
        {"type": "remove", "wordId": remove_id},
    )
    expect(status == 200, f"remove → {status}")
    new_ids = [c["wordId"] for c in after_remove.get("candidates", [])]
    expect(remove_id not in new_ids, "removed word left the visible list")
    expect(len(new_ids) == 10, "remove auto-filled a replacement")
    expect(remove_id in (after_remove.get("usedWords") or []), "removed word stays in usedWords")

    status, missing_rep = request(
        "POST",
        f"/api/selections/{sid}/actions",
        {"type": "replace", "wordId": new_ids[0]},
    )
    expect(status == 400, f"replace without replacementWordId is 400 → {status}")

    pools = (after_remove.get("recommendedWords") or []) + (after_remove.get("otherWords") or [])
    expect(len(pools) > 0, "leftover pool still has a manual replacement")
    pick = pools[0]["wordId"]
    replace_id = new_ids[0]
    status, after_replace = request(
        "POST",
        f"/api/selections/{sid}/actions",
        {"type": "replace", "wordId": replace_id, "replacementWordId": pick},
    )
    expect(status == 200, f"replace → {status}")
    expect(after_replace["candidates"][0]["wordId"] == pick, "replace used teacher-chosen word")
    expect(replace_id not in [c["wordId"] for c in after_replace.get("candidates", [])], "old word left visible")

    status, committed = request("POST", f"/api/selections/{sid}/commit", {})
    expect(status == 201 and "event" in committed, f"commit → {status}")
    expect(committed["event"]["finalSelection"], "commit stores finalSelection")

    status, again = request("POST", f"/api/selections/{sid}/commit", {})
    expect(status == 409, f"second commit is 409 → {status}")

    status, bad_score = request(
        "POST",
        "/api/selections",
        {**create_body, "preferredFeatureIds": ["feat-frequency"]},
    )
    expect(status == 400, f"score id in preferredFeatureIds is 400 → {status}")

    status, unknown = request(
        "POST",
        "/api/selections",
        {**create_body, "preferredFeatureIds": ["feat-not-real"]},
    )
    expect(status == 400, f"unknown preferredFeatureId is 400 → {status}")

    status, empty_grade = request(
        "POST",
        "/api/selections",
        {
            **create_body,
            "levelRange": {
                "from": {"grade": 1, "term": 1},
                "to": {"grade": 1, "term": 1},
            },
            "preferredFeatureIds": [],
        },
    )
    expect(status == 201, f"grade 1 request still 201 → {status}")
    expect(len(empty_grade.get("candidates", [])) == 0, "no grade-1 words in this dump")

    if failures:
        print(f"\n{len(failures)} check(s) failed")
        return 1
    print("\nall smoke checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
