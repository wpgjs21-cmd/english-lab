# english-lab

업무 영어 학습 사이트. 매일 영어카드, 토요일 주간시험, 매일 영어 브리핑 대본을 폰에서 보는 정적 사이트(HTML·JS)와 그 데이터(JSON)를 담은 공개 저장소다. 카드·시험·브리핑은 PC의 Claude 예약작업이 만들어 `data/`에 넣고, GitHub Pages가 그대로 보여 준다. 내 답과 채점 결과처럼 공개하면 안 되는 것은 이 저장소에 두지 않고 비공개 저장소 `hermes`의 `english/`에 둔다.

사이트 주소: https://wpgjs21-cmd.github.io/english-lab/

## 화면 6개

| 화면 | 주소 | 한 줄 설명 |
|---|---|---|
| 카드 | `#/card/YYYY-MM-DD` | 그날 복습·가리고 써 보기·단어·패턴·고쳐쓰기·오늘 쓸 표현. 화요일엔 지난주 성적표가 맨 위 |
| 시험 | `#/test/YYYY-MM-DD` | 토요일 주간시험. A·B는 즉시 채점, C·D는 틀(패턴) 0.5만 즉시, 절 0.5는 월요일 정식 채점 |
| 성적 | `#/scores` | 시험별 점수·유형별 정답률. 토큰이 있으면 hermes의 `results.csv`를 읽어 정식 값을 보여 줌 |
| 사전 | `#/dict` | 배운 표현 전체(단어·패턴), 오답 표시, 실전 사용일 기록 |
| 브리핑 | `#/brief/YYYY-MM-DD` | 영어 브리핑 대본 문단별 재생(음성) |
| 설정 | `#/settings` | 비공개 저장소 토큰, 음성 속도, 이 기기 기록 내보내기·불러오기 |

## 폴더 구조

```
english-lab/
  index.html  app.js  style.css  manifest.json  icon*.{svg,png}   사이트 본체
  data/
    index.json          날짜 목록 (Actions가 자동 생성, 손으로 고치지 않음)
    settings.json       학습 설정과 변경 이력
    expressions.json    표현 사전
    cards/YYYY-MM-DD.json      일일 카드
    tests/YYYY-MM-DD.json      주간시험 (날짜 = 시험일, 토요일)
    briefings/YYYY-MM-DD.json  브리핑 대본 (날짜 = 들을 날)
  tools/build_index.py  data/를 훑어 index.json 생성
  .github/workflows/build-index.yml  data/ 변경 시 index.json 자동 갱신
```

## 데이터 스키마

### 카드 `data/cards/YYYY-MM-DD.json`

| 필드 | 뜻 | 예 |
|---|---|---|
| date | 카드 날짜 | `"2026-10-26"` |
| weekday | 요일 한 글자 | `"월"` |
| note | 상단 안내 문구. 없으면 빈 문자열 | `""` |
| routine | 10~15분 루틴 한 줄 | `"복습 3분 → 새 내용 7분 → ..."` |
| scorecard | 지난주 성적표. 화요일 카드만, 없으면 `null` | 아래 표 |
| review.title | 복습 영역 제목 | `"복습 (어제 10/22 표현, ...)"` |
| review.items[] | 복습 문항 목록 | |
| review.items[].prompt | 한국어 뜻 또는 상황 | `"실행 가능한"` |
| review.items[].answer | 정답(영어) | `"feasible"` |
| review.items[].flag | 오답 재출제면 `"오답"`, 아니면 빈 문자열 | `"오답"` |
| cover_practice[] | 가리고 써 보기. 없으면 빈 배열 | |
| cover_practice[].prompt | 뜻 + 첫 글자 힌트 있는 예문 | `"막다: Please cover ... to p______ water damage."` |
| cover_practice[].answer | 정답 | `"prevent"` |
| words[] | 새 단어(보통 5개) | |
| words[].word / pos / meaning | 단어, 품사, 뜻(— 대신 쓰던 말) | `"clarify"` / `"v."` / `"분명히 하다 — check 대신"` |
| words[].example | 예문 | `"Could you clarify which task each person does?"` |
| words[].collocations | 짝꿍 표현 | `"clarify the reason / clarify with someone"` |
| patterns[] | 새 패턴(보통 3개) | |
| patterns[].pattern | 패턴 | `"Going forward, please ~."` |
| patterns[].meaning | 뜻과 쓰임 | `"앞으로는 ~해 주세요 (From now on 대신)"` |
| patterns[].skeleton | 뼈대 한 줄. 없으면 빈 문자열 | `"Going forward, please + [동사원형]"` |
| patterns[].email | 메일용 예문 | `"Going forward, please cc Nga on all accounting emails."` |
| patterns[].spoken | 말할 때 예문 | `"From now on, always cc Nga."` |
| rewrite.original / improved / note | 내 문장 고쳐쓰기: 원문, 고친 문장, 설명. 없으면 사이트가 칸을 숨김 | |
| source | 재료가 된 메일 요약 | `"10/23 보낸 메일(...)"` |

scorecard 객체(화요일 카드). 점수는 넣지 않는다(공개 저장소). 사이트가 점수를 hermes의 results.csv(토큰) 또는 기기 채점에서 가져온다:

| 필드 | 뜻 | 예 |
|---|---|---|
| test_date | 채점한 시험일 | `"2026-10-24"` |
| focus | 약점 한 줄(숫자 없이) | `"B 빈칸과 영작의 절이 약함"` |
| experts[] | 전문가 한 줄 평 `{who, line}` | `{"who": "언어 습득 연구자", "line": "..."}` |
| change | 이번 주 바뀌는 점 | `"단어 앞에 가리고 써 보기 칸"` |

### 시험 `data/tests/YYYY-MM-DD.json`

| 필드 | 뜻 | 예 |
|---|---|---|
| date / weekday | 시험일, 요일 | `"2026-10-24"` / `"토"` |
| scope | 출제 범위 설명 | `"10/22~10/23 표현 16개"` |
| count | 문항 수 | `16` |
| time_limit_min | 제한 시간(분) | `15` |
| grading_rule | 채점 규칙 문장 | `"정답 1, 부분 정답 0.5, ..."` |
| memo | 출제 메모 | `"범위 16개라 ... A6·B4·C4·D2"` |
| questions[] | 문항 목록 | |
| questions[].no | 번호 | `2` |
| questions[].type | A 뜻 보고 쓰기 / B 빈칸 / C 패턴 영작 / D 업그레이드 | `"C"` |
| questions[].prompt | 문제 | `"\"Could you confirm whether ~?\"로 영작: ..."` |
| questions[].answer | 정답 | `"Could you confirm whether all the fabric has arrived ...?"` |
| questions[].accept | 정답으로 인정하는 다른 답 배열(없으면 `[]`) | `["double-check"]` |
| questions[].pattern | C·D만. 즉시 채점에 쓰는 소문자 핵심 패턴 | `"could you confirm whether"` |
| questions[].expression | 어느 표현의 문제인지 | `"Could you confirm whether ~?"` |
| questions[].kind | `단어` 또는 `패턴` | `"패턴"` |
| questions[].learned | 배운 날 | `"2026-10-22"` |
| questions[].topic | 주제 | `"구매·품의"` |
| questions[].reissue | `신규` / `오답` / `유지율` | `"신규"` |
| questions[].note | 해설(제출 후 표시) | `"whether 뒤는 평서문 어순"` |

### 브리핑 `data/briefings/YYYY-MM-DD.json`

| 필드 | 뜻 | 예 |
|---|---|---|
| date / weekday | 들을 날(작성 다음 날), 요일 | `"2026-10-24"` / `"토"` |
| title | 제목 | `"영어브리핑_2026-10-24"` |
| written_at | 작성 시각 | `"2026-10-23 07:40"` |
| korean_summary | 맨 끝 한국어 한 줄 요약 | `"내일 핵심: ..."` |
| paragraphs[] | 대본. 빈 줄 기준 문단 배열, 문단 단위로 재생 | `["Good morning, Anthony. ...", "..."]` |

### 표현 사전 `data/expressions.json` (객체 배열)

| 필드 | 뜻 | 예 |
|---|---|---|
| expression | 표현 | `"feasible"` / `"I'm following up on ~"` |
| kind | `단어` 또는 `패턴` | `"단어"` |
| pos | 품사. 패턴은 빈 문자열 | `"adj."` |
| meaning | 뜻 | `"실행 가능한, 현장에서 해 볼 만한"` |
| topic | 주제 | `"구매·품의"` |
| learned | 배운 날 | `"2026-10-22"` |
| wrong | 최근 시험 오답이면 `true`, 1점으로 회복하면 `false` | `true` |
| first_used | 실전 첫 사용일. 아직 없으면 `null` | `null` |

### 설정 `data/settings.json`

| 필드 | 뜻 | 예 |
|---|---|---|
| words_per_day / patterns_per_day | 하루 단어·패턴 수 | `5` / `3` |
| routine_minutes | 하루 학습 시간 | `"10~15"` |
| review_intervals_days | 복습 간격(일) | `[1, 7, 14]` |
| test_day / grading_day / scorecard_day | 시험·채점·성적표 요일과 시각 | `"토"` / `"월 16:30"` / `"화 06:50"` |
| history[] | 변경 이력 `{date, change, by}` | `{"date": "2026-10-26", "change": "...", "by": "전문가 검토"}` |

### index.json (자동 생성, 수정 금지)

`generated`(생성 시각), `cards`·`tests`·`briefings`(날짜 문자열 배열), `expressions`(표현 개수). 사이트는 이 파일로 날짜를 찾아 해당 JSON을 읽는다.

## 새 날짜 파일 넣는 법

1. `data/cards/YYYY-MM-DD.json`, `data/tests/YYYY-MM-DD.json`, `data/briefings/YYYY-MM-DD.json` 중 필요한 것을 위 스키마대로 추가하고 필요하면 `data/expressions.json`, `data/settings.json`도 고친다.
2. `main`에 커밋·push 한다.
3. GitHub Actions(`build-index`)가 `data/index.json`을 다시 만들어 커밋하고, Pages가 반영한다(보통 1~2분).
4. 로컬에서 바로 확인하려면 `python3 tools/build_index.py`. 깨진 JSON이 있으면 파일 이름을 알려 주고 멈춘다.

push 뒤 index.json을 Actions가 따로 커밋하므로, 다음 작업 전에 `git pull --rebase`를 먼저 한다.

## 비공개 데이터와 토큰

- 내 시험 답(`answers/YYYY-MM-DD.json`), 문항별 채점 결과(`results.csv`), 성적표(`성적표_YYYY-MM-DD.md`)는 비공개 저장소 `hermes`의 `english/`에 있다. 이 저장소에는 넣지 않는다.
- 사이트 `설정` 화면에서 토큰을 넣으면 시험 제출 시 답이 hermes에 저장되고, 성적 화면이 `results.csv`를 읽는다. 토큰이 없어도 카드·시험·사전·브리핑은 쓸 수 있고 답은 이 기기 브라우저에만 남는다.
- 토큰은 GitHub의 Fine-grained personal access token으로 만든다. 저장소는 `hermes` 하나만 선택하고 권한은 Contents: Read and write만 준다. 토큰은 이 기기 브라우저에만 저장된다.

## 로컬 미리보기

```
python3 -m http.server 8765 --directory .
```

브라우저에서 http://localhost:8765/ 를 연다.

## 운영 원칙

- 학습물(카드·시험·브리핑·사전)은 회사 OneDrive에 두지 않는다. 이 저장소와 hermes 저장소, 구글 드라이브 영어학습 폴더에서만 다룬다.
- 공개 저장소에는 내 답·문항별 점수·개인 정보를 넣지 않는다. 답 원문과 `results.csv`는 hermes에만 둔다. 화요일 카드의 `scorecard`에는 점수를 넣지 않는다(전문가 한 줄 평·약점·바뀌는 점만). 점수는 사이트가 hermes의 `results.csv`(토큰) 또는 이 기기의 즉시 채점에서 읽어 보여 준다.
- 구글 문서는 당분간 그대로 유지하고 JSON을 함께 쓴다(1단계 병행). 절차는 hermes의 `config/tasks/english-site-publish.md`.
