#!/usr/bin/env python3
"""data/ 폴더를 훑어 data/index.json을 만든다. 카드·시험·브리핑 날짜 목록과 표현 수.
사이트는 이 파일 하나만 읽고 날짜별 파일을 골라 간다. 의존 패키지 없음."""
import json, os, sys, datetime
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
def dates(sub):
    d = os.path.join(root, sub)
    if not os.path.isdir(d): return []
    out = []
    for f in sorted(os.listdir(d)):
        if f.endswith(".json") and len(f) == 15:
            try: json.load(open(os.path.join(d, f), encoding="utf-8"))
            except Exception as e: print(f"깨진 JSON: {sub}/{f}: {e}", file=sys.stderr); sys.exit(1)
            out.append(f[:-5])
    return out
expr = json.load(open(os.path.join(root, "expressions.json"), encoding="utf-8"))
index = {"generated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
         "cards": dates("cards"), "tests": dates("tests"), "briefings": dates("briefings"),
         "expressions": len(expr)}
json.dump(index, open(os.path.join(root, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps(index, ensure_ascii=False))
