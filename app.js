/* 업무 영어 — 정적 사이트. 데이터는 data/*.json, 내 기록은 브라우저(localStorage)와(토큰이 있으면) 비공개 저장소. */
(() => {
  'use strict';

  // ---------- 상태 ----------
  const KEY = 'english-lab.v1';
  const defaults = {
    token: '', privRepo: 'wpgjs21-cmd/hermes', privPath: 'english',
    done: {},          // {날짜: true} 카드 학습 완료
    todayExpr: {},     // {날짜: '오늘 쓸 표현'}
    cover: {},         // {날짜: {i: '내 답'}}
    tests: {},         // {시험일: {answers:{no:답}, submitted:ISO, grading:{no:{score,reason,pending}}, startedAt}}
    used: {},          // {표현: 'YYYY-MM-DD' 첫 실전사용}
    rate: 0.9, voiceURI: '', silentBypass: false,
  };
  let S = load();
  function load() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch { return Object.assign({}, defaults); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

  // ---------- 유틸 ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const app = $('#app');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function fmtDate(s) { if (!s) return ''; const [y, m, d] = s.split('-').map(Number); const w = '일월화수목금토'[new Date(y, m - 1, d).getDay()]; return `${m}/${d} (${w})`; }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, 2200); }
  const cache = {};
  async function getJSON(path, bust) {
    const k = path; if (cache[k] && !bust) return cache[k];
    const r = await fetch(path + (bust ? `?v=${Date.now()}` : ''), { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${path} ${r.status}`);
    return cache[k] = await r.json();
  }
  function latestOnOrBefore(dates, day) { const c = dates.filter(d => d <= day); return c.length ? c[c.length - 1] : (dates[dates.length - 1] || null); }

  // ---------- 음성 ----------
  let voice = null;
  // 음성 품질 점수: iPhone·Mac에 내려받은 프리미엄 > 향상(Enhanced) > Google/Siri > 기본. 영어(en-US 우선)만.
  const NOVELTY = /bahh|bad news|bells|boing|bubbles|cellos|deranged|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|kathy|ralph|eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley|hysterical|pipe organ/;
  function voiceScore(v) {
    const id = `${v.voiceURI} ${v.name}`.toLowerCase();
    let s = 0;
    if (NOVELTY.test(id)) return -100;                       // 장난·캐릭터 음성은 제외
    if (/premium/.test(id)) s += 40; else if (/enhanced|neural|natural|online/.test(id)) s += 25; else if (/google|siri|aria|jenny|guy/.test(id)) s += 12;
    if (/en-us/i.test(v.lang) || /en_us/i.test(v.lang)) s += 8; else if (/^en/i.test(v.lang)) s += 3;
    if (/samantha|ava\b|zoe|allison|nicky|evan|nathan|joelle|noelle|aaron|tom\b|susan|daniel|karen|moira|tessa|rishi|serena|kate\b|oliver/.test(id)) s += 6;
    if (/samantha|ava\b|zoe/.test(id)) s += 2;
    return s;
  }
  function voiceLabel(v) {
    const id = `${v.voiceURI} ${v.name}`.toLowerCase();
    const q = /premium/.test(id) ? '프리미엄' : /enhanced|neural|natural/.test(id) ? '향상' : /google|siri/.test(id) ? '보통' : /compact/.test(id) ? '기본' : '기본';
    return `${v.name} (${v.lang}, ${q})`;
  }
  function englishVoices() { return speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang) && voiceScore(v) >= 0).sort((a, b) => voiceScore(b) - voiceScore(a)); }
  function pickVoice() {
    const vs = englishVoices();
    const chosen = S.voiceURI && vs.find(v => v.voiceURI === S.voiceURI);
    voice = (chosen && voiceScore(chosen) >= 0 ? chosen : null) || vs[0] || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  // iOS 사파리 주의: cancel() 직후 speak()는 묵음이 되기 쉬워 잠깐 띄운다. 발화 객체는 GC되지 않게 붙잡는다.
  // iOS 무음 스위치 우회: 사용자 터치 안에서 무음 오디오를 틀어 두면 음성 합성도 미디어 채널로 나간다 (최선 시도).
  const SILENT_WAV = 'data:audio/wav;base64,UklGRoQJAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWAJAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA=';
  let bgAudio = null;
  function audioUnlock() {
    if (!S.silentBypass) return;
    try {
      if (!bgAudio) { bgAudio = new Audio(SILENT_WAV); bgAudio.loop = true; bgAudio.volume = 0.01; bgAudio.setAttribute('playsinline', ''); }
      const p = bgAudio.play(); if (p && p.catch) p.catch(() => {});
    } catch {}
  }
  function audioRelease() { try { if (bgAudio) { bgAudio.pause(); } } catch {} }
  const utterKeep = []; let lastSpeakStart = 0;
  function speak(text, { onend, onstart, onerror } = {}) {
    if (!('speechSynthesis' in window)) { toast('이 브라우저는 음성을 지원하지 않습니다'); return null; }
    const u = new SpeechSynthesisUtterance(text.replace(/~/g, 'something').replace(/\[.*?\]/g, ''));
    u.lang = 'en-US'; u.rate = S.rate || 0.9; u.volume = 1;
    if (voice) { const live = speechSynthesis.getVoices().find(v => v.voiceURI === voice.voiceURI); if (live) u.voice = live; }
    u.onstart = () => { lastSpeakStart = Date.now(); if (onstart) onstart(); };
    u.onend = () => { if (onend) onend(); };
    u.onerror = e => { if (e.error === 'interrupted' || e.error === 'canceled') return; if (onerror) onerror(e); else toast(`음성 오류: ${e.error}`); };
    utterKeep.push(u); if (utterKeep.length > 40) utterKeep.shift();
    audioUnlock();
    const go = () => speechSynthesis.speak(u);
    if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); setTimeout(go, 150); } else go();
    return u;
  }
  function stopSpeak() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  const speakBtn = (text, title = '듣기') => `<button class="speak" data-say="${esc(text)}" title="${title}" aria-label="${title}">▶</button>`;

  // ---------- 채점 ----------
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
      .replace(/~/g, ' ').replace(/[.,!?;:"()]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function dl(a, b) { // Damerau-Levenshtein (인접 글자 바뀜 = 1)
    const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) d[i][0] = i; for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  function grade(q, raw) {
    const a = norm(raw);
    if (!a) return { score: 0, reason: '빈칸', pending: false };
    const ans = norm(q.answer); const accepts = (q.accept || []).map(norm);
    if (q.type === 'A' || q.type === 'B') {
      if (a === ans || accepts.includes(a)) return { score: 1, reason: '', pending: false };
      const asWord = new RegExp(`(^| )${ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`);
      if (asWord.test(a) || accepts.some(x => x && new RegExp(`(^| )${x}( |$)`).test(a))) return { score: 1, reason: '', pending: false };
      const ansWords = ans.split(' ');
      if (ansWords.length > 1 && (a === ansWords[0] || a.split(' ').includes(ansWords[0]))) return { score: 0.5, reason: '짝꿍 틀림', pending: false };
      const dist = dl(a.replace(/ /g, ''), ans.replace(/ /g, ''));
      if (ans.length >= 4 && dist === 1) return { score: 0.5, reason: '철자', pending: false };
      const sameStem = a.slice(0, 4) === ans.slice(0, 4);
      return { score: 0, reason: sameStem ? '철자·품사' : '뜻 혼동', pending: false };
    }
    // C·D: 틀 0.5 (지정 패턴 사용) + 절 0.5 (월요일 채점)
    const pat = norm(q.pattern || '');
    const frame = pat && a.includes(pat) ? 0.5 : 0;
    if (a === ans || accepts.includes(a)) return { score: 1, reason: '', pending: false };
    return { score: frame, reason: frame ? '' : '패턴 틀림', pending: frame > 0 };
  }

  // ---------- 비공개 저장소 (GitHub API) ----------
  async function gh(path, opt = {}) {
    if (!S.token) throw new Error('토큰 없음');
    const r = await fetch(`https://api.github.com/repos/${S.privRepo}/contents/${path}`, {
      ...opt, headers: { Authorization: `Bearer ${S.token}`, Accept: 'application/vnd.github+json', ...(opt.headers || {}) },
    });
    if (r.status === 404 && (opt.method || 'GET') === 'GET') return null;
    if (!r.ok) throw new Error(`GitHub ${r.status}`);
    return r.json();
  }
  function b64(s) { return btoa(unescape(encodeURIComponent(s))); }
  function unb64(s) { return decodeURIComponent(escape(atob(s.replace(/\n/g, '')))); }
  async function putPrivate(rel, content, message) {
    const path = `${S.privPath}/${rel}`;
    const cur = await gh(path);
    return gh(path, { method: 'PUT', body: JSON.stringify({ message, content: b64(content), sha: cur?.sha }) });
  }
  async function readPrivate(rel) { const f = await gh(`${S.privPath}/${rel}`); return f ? unb64(f.content) : null; }

  // ---------- 라우터 ----------
  const routes = { card: pageCard, test: pageTest, scores: pageScores, dict: pageDict, brief: pageBrief, settings: pageSettings };
  let INDEX = null;
  async function render() {
    stopSpeak();
    const [, name = 'card', arg = ''] = (location.hash || '#/card').split('/');
    document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === name));
    try {
      if (!INDEX) INDEX = await getJSON('data/index.json', true);
      $('#top-right').textContent = fmtDate(todayStr());
      await (routes[name] || pageCard)(arg);
      window.scrollTo(0, 0);
    } catch (e) {
      app.innerHTML = `<div class="card warn"><b>불러오지 못했습니다.</b><p class="small">${esc(e.message)}</p><p class="small">data/index.json이 있는지, 저장소가 올라갔는지 확인하세요.</p></div>`;
    }
  }
  window.addEventListener('hashchange', render);

  // 공통 클릭 처리
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-say]'); if (b) { if (briefRun) briefRun.stop = true; speak(b.dataset.say); }
    const r = e.target.closest('.rev[data-reveal]'); if (r) { const a = $('.a', r); a.classList.toggle('hidden'); }
  });

  // ---------- 카드 ----------
  async function pageCard(arg) {
    const dates = INDEX.cards; if (!dates.length) { app.innerHTML = '<p class="muted">카드가 없습니다.</p>'; return; }
    const date = dates.includes(arg) ? arg : latestOnOrBefore(dates, todayStr());
    const i = dates.indexOf(date);
    const c = await getJSON(`data/cards/${date}.json`);
    const sc = c.scorecard;
    const isFuture = date > todayStr();
    let h = `
      <div class="datenav">
        <a class="btn" href="#/card/${dates[i - 1] || date}" ${i === 0 ? 'style="visibility:hidden"' : ''}>‹ 이전</a>
        <span class="d">${fmtDate(date)} 카드</span>
        <a class="btn" href="#/card/${dates[i + 1] || date}" ${i === dates.length - 1 ? 'style="visibility:hidden"' : ''}>다음 ›</a>
      </div>
      ${isFuture ? `<p class="small muted">미리 만들어 둔 카드입니다.</p>` : ''}
      ${c.note ? `<p class="small muted">${esc(c.note)}</p>` : ''}`;
    if (sc) {
      // 점수는 공개 카드에 없다. 비공개 저장소(토큰) 또는 이 기기의 즉시 채점에서 가져온다.
      let src = null, label = '';
      const td = sc.test_date;
      const tj = INDEX.tests.includes(td) ? await getJSON(`data/tests/${td}.json`) : null;
      if (S.token) {
        try { const csv = await readPrivate('results.csv'); const rs = csv ? parseCSV(csv).filter(r => r['시험일'] === td) : [];
          if (rs.length) { const by = {}; let total = 0; rs.forEach(r => { const k = r['유형'], v = parseFloat(r['점수']) || 0; by[k] = by[k] || { s: 0, n: 0 }; by[k].s += v; by[k].n++; total += v; });
            src = { total, n: rs.length, by, wrong: rs.filter(r => (parseFloat(r['점수']) || 0) < 1).map(r => `${r['번호']}. ${r['내 답'] || '(빈칸)'} → ${r['표현']}`) };
            label = rs[0]['상태'] === '정식' ? '정식 채점' : `${rs[0]['상태'] || '예비'} 채점`; } } catch {}
      }
      if (!src && tj && S.tests[td]?.grading) { const rec = S.tests[td]; const sm = summarize(tj, rec.grading);
        src = { total: sm.total, n: sm.n, by: sm.by, wrong: tj.questions.filter(q => rec.grading[q.no].score < 1).map(q => `${q.no}. ${rec.answers[q.no] || '(빈칸)'} → ${q.answer}`) }; label = '즉시 채점(이 기기)'; }
      const pct = (s, n) => n ? Math.round(s / n * 100) : 0;
      h += `<div class="card soft">
        <div class="row between"><b>지난주 성적표 (${fmtDate(td)} 시험)</b><a class="small" href="#/scores">자세히</a></div>
        ${src ? `<div class="big">${src.total} / ${src.n}점 (${pct(src.total, src.n)}%)</div><p class="small muted">${esc(label)}</p>
          <div class="kv">${['A', 'B', 'C', 'D'].filter(k => src.by[k]).map(k => `<b>${k} ${({ A: '뜻 보고 쓰기', B: '빈칸 채우기', C: '패턴 영작', D: '업그레이드' })[k]}</b><span>${pct(src.by[k].s, src.by[k].n)}% (${src.by[k].s}/${src.by[k].n})</span>`).join('')}</div>
          ${src.wrong.length ? `<details><summary>틀린 문제 ${src.wrong.length}</summary><ul class="small">${src.wrong.map(w => `<li>${esc(w)}</li>`).join('')}</ul></details>` : ''}`
          : `<p class="small">점수는 <a href="#/scores">성적 탭</a>에서 봅니다. 이 기기에서 시험을 제출했거나 설정에 토큰을 넣으면 여기에도 표시됩니다.</p>`}
        ${sc.focus ? `<p class="small"><b>약점:</b> ${esc(sc.focus)}</p>` : ''}
        ${sc.experts?.length ? `<p class="small"><b>전문가 한 줄 평</b></p><ul class="small">${sc.experts.map(x => `<li><b>${esc(x.who)}</b>: ${esc(x.line)}</li>`).join('')}</ul>` : ''}
        ${sc.change ? `<p class="small"><b>이번 주 바뀌는 점:</b> ${esc(sc.change)}</p>` : ''}
      </div>`;
    }
    h += `<div class="card"><b>10~15분 루틴</b><p class="small">${esc(c.routine)}</p></div>`;

    if (c.review?.items?.length) {
      h += `<h2>${esc(c.review.title)}</h2><div class="card"><p class="help">줄을 누르면 정답이 보입니다. 먼저 노트에 써 보세요.</p>
        ${c.review.items.map((it, k) => `<div class="rev" data-reveal><span class="n">${k + 1}.</span><div class="grow">${esc(it.prompt)} ${it.flag ? `<span class="pill bad">${esc(it.flag)}</span>` : ''}<div class="a-wrap"><span class="a hidden">${esc(it.answer)}</span></div></div></div>`).join('')}
      </div>`;
    }
    if (c.cover_practice?.length) {
      const saved = S.cover[date] || {};
      h += `<h2>가리고 써 보기</h2><div class="card"><p class="help">아래 단어를 보기 전에 먼저 채우고 확인을 누르세요.</p>
        ${c.cover_practice.map((it, k) => `<div class="q" data-k="${k}"><div class="qp">${k + 1}. ${esc(it.prompt)}</div>
          <div class="row"><input type="text" class="grow cover-in" data-k="${k}" value="${esc(saved[k] || '')}" autocapitalize="off" autocomplete="off" placeholder="영어로">
          <button class="tiny cover-chk" data-k="${k}">확인</button></div><div class="cover-res" data-k="${k}"></div></div>`).join('')}
      </div>`;
    }
    h += `<h2>단어 ${c.words.length}</h2><div class="card">${c.words.map(w => `
      <div class="word"><div class="head"><span class="w">${esc(w.word)}</span><span class="pos">${esc(w.pos)}</span>${speakBtn(w.word)}</div>
        <div>${esc(w.meaning)}</div>
        <div class="ex row"><span class="grow">예문: ${esc(w.example)}</span>${speakBtn(w.example)}</div>
        <div class="col">짝꿍: ${esc(w.collocations)}</div></div>`).join('')}</div>`;
    h += `<h2>패턴 ${c.patterns.length}</h2><div class="card">${c.patterns.map(p => `
      <div class="word"><div class="head"><span class="w">${esc(p.pattern)}</span></div>
        <div>${esc(p.meaning)}</div>
        ${p.skeleton ? `<div class="col">뼈대: ${esc(p.skeleton)}</div>` : ''}
        <div class="ex row"><span class="grow">메일: ${esc(p.email)}</span>${speakBtn(p.email)}</div>
        <div class="ex row"><span class="grow muted">말할 때: ${esc(p.spoken)}</span>${speakBtn(p.spoken)}</div></div>`).join('')}</div>`;
    if (c.rewrite?.original) {
      h += `<h2>내 문장 고쳐쓰기</h2><div class="card"><p class="muted"><s>${esc(c.rewrite.original)}</s></p>
        <div class="row"><b class="grow">${esc(c.rewrite.improved)}</b>${speakBtn(c.rewrite.improved)}</div><p class="small">${esc(c.rewrite.note)}</p></div>`;
    }
    h += `<h2>오늘 쓸 표현</h2><div class="card">
      <input type="text" id="today-expr" value="${esc(S.todayExpr[date] || '')}" placeholder="오늘 메일에 쓸 표현 하나" autocapitalize="off">
      <p class="help">실제로 썼으면 사전에서 그 표현의 "썼음"을 누르세요.</p>
      <label class="check" style="margin-top:10px"><input type="checkbox" id="done-chk" ${S.done[date] ? 'checked' : ''}> 오늘 학습 완료 (노트 쓰기 + 3번 읽기)</label>
    </div>
    ${c.source ? `<p class="small muted">재료: ${esc(c.source)}</p>` : ''}
    <p class="small muted">학습 완료 ${Object.keys(S.done).filter(d => S.done[d]).length}일</p>`;
    app.innerHTML = h;

    $('#today-expr').addEventListener('input', e => { S.todayExpr[date] = e.target.value; save(); });
    $('#done-chk').addEventListener('change', e => { S.done[date] = e.target.checked; save(); toast(e.target.checked ? '오늘 학습 완료' : '완료 해제'); });
    app.querySelectorAll('.cover-chk').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k; const inp = $(`.cover-in[data-k="${k}"]`); const it = c.cover_practice[k];
      S.cover[date] = S.cover[date] || {}; S.cover[date][k] = inp.value; save();
      const g = grade({ type: 'A', answer: it.answer, accept: [] }, inp.value);
      const res = $(`.cover-res[data-k="${k}"]`);
      res.innerHTML = `<div class="result ${g.score === 1 ? 'good' : g.score ? 'half' : 'bad'}">${g.score === 1 ? '맞았습니다' : g.score ? '거의 맞음 (철자)' : '다시'} · 정답 <b>${esc(it.answer)}</b></div>`;
    }));
  }

  // ---------- 시험 ----------
  let timerH = null;
  async function pageTest(arg) {
    clearInterval(timerH);
    const dates = INDEX.tests; if (!dates.length) { app.innerHTML = '<p class="muted">시험이 없습니다.</p>'; return; }
    const date = dates.includes(arg) ? arg : latestOnOrBefore(dates, todayStr());
    const t = await getJSON(`data/tests/${date}.json`);
    const rec = S.tests[date] || (S.tests[date] = { answers: {}, submitted: null, grading: null, startedAt: null });
    const i = dates.indexOf(date);
    const nav = `<div class="datenav">
        <a class="btn" href="#/test/${dates[i - 1] || date}" ${i === 0 ? 'style="visibility:hidden"' : ''}>‹ 이전</a>
        <span class="d">${fmtDate(date)} 주간시험</span>
        <a class="btn" href="#/test/${dates[i + 1] || date}" ${i === dates.length - 1 ? 'style="visibility:hidden"' : ''}>다음 ›</a></div>`;

    if (rec.submitted) return renderTestResult(t, rec, nav);

    if (!rec.startedAt) {
      app.innerHTML = `${nav}<div class="card">
        <h1>주간 업무 영어 시험</h1>
        <p>${esc(t.scope)} · ${t.count}문제 · 제한 ${t.time_limit_min}분</p>
        <p class="small muted">노트·카드 보지 말 것. 유형: [A] 뜻 보고 영어 쓰기 · [B] 빈칸 채우기 · [C] 패턴 영작 · [D] 쉬운 문장 업그레이드</p>
        <p class="small muted">A·B는 제출 즉시 채점됩니다. C·D 영작은 패턴(틀) 0.5점만 즉시, 나머지 0.5점은 월요일 채점에서 정해집니다.</p>
        ${date > todayStr() ? `<p class="pill warn">시험일 전입니다</p>` : ''}
        <p><button class="primary" id="start">시험 시작</button></p>
        <p class="help">종이에 풀었다면 시작 후 답만 옮겨 적어도 됩니다.</p>
      </div>`;
      $('#start').onclick = () => { rec.startedAt = Date.now(); save(); pageTest(date); };
      return;
    }

    app.innerHTML = `${nav}
      <div class="sticky-ctl row between"><span class="timer" id="timer">--:--</span><span class="small muted" id="filled"></span></div>
      <div class="card">${t.questions.map(q => `
        <div class="q"><div class="qp"><span class="no">${q.no}.</span><span class="pill gray">${q.type}</span> ${esc(q.prompt)}</div>
          ${q.type === 'A' || q.type === 'B'
            ? `<input type="text" class="ans" data-no="${q.no}" value="${esc(rec.answers[q.no] || '')}" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="영어로">`
            : `<textarea class="ans" data-no="${q.no}" autocapitalize="sentences" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="문장으로">${esc(rec.answers[q.no] || '')}</textarea>`}
        </div>`).join('')}
      </div>
      <div class="row"><button class="primary grow" id="submit">제출하고 채점</button></div>
      <p class="help">답은 입력하는 대로 이 기기에 저장됩니다. 제출 전에 닫아도 남습니다.</p>`;
    const update = () => { const n = Object.values(rec.answers).filter(v => v && v.trim()).length; $('#filled').textContent = `${n}/${t.count} 입력`; };
    app.querySelectorAll('.ans').forEach(el => el.addEventListener('input', () => { rec.answers[el.dataset.no] = el.value; save(); update(); }));
    update();
    const tick = () => {
      const left = t.time_limit_min * 60 - Math.floor((Date.now() - rec.startedAt) / 1000);
      const el = $('#timer'); if (!el) { clearInterval(timerH); return; }
      const a = Math.abs(left); el.textContent = `${left < 0 ? '+' : ''}${pad(Math.floor(a / 60))}:${pad(a % 60)}`; el.classList.toggle('late', left < 0);
    };
    tick(); timerH = setInterval(tick, 1000);
    $('#submit').onclick = () => {
      const empty = t.questions.filter(q => !(rec.answers[q.no] || '').trim()).length;
      if (empty && !confirm(`빈칸이 ${empty}개 있습니다. 그대로 제출할까요? (빈칸은 0점)`)) return;
      rec.grading = {}; t.questions.forEach(q => rec.grading[q.no] = grade(q, rec.answers[q.no]));
      rec.submitted = new Date().toISOString(); rec.elapsedSec = Math.floor((Date.now() - rec.startedAt) / 1000); save();
      clearInterval(timerH); pageTest(date);
    };
  }
  function summarize(t, grading) {
    const by = {}; let total = 0, pending = 0;
    t.questions.forEach(q => { const g = grading[q.no]; by[q.type] = by[q.type] || { s: 0, n: 0 }; by[q.type].s += g.score; by[q.type].n++; total += g.score; if (g.pending) pending++; });
    return { by, total, pending, n: t.questions.length };
  }
  function renderTestResult(t, rec, nav) {
    const sm = summarize(t, rec.grading);
    const pct = Math.round(sm.total / sm.n * 100);
    app.innerHTML = `${nav}
      <div class="card soft"><div class="row between"><b>즉시 채점 결과</b><span class="small muted">${new Date(rec.submitted).toLocaleString('ko-KR')}${rec.elapsedSec ? ` · ${Math.floor(rec.elapsedSec / 60)}분 ${rec.elapsedSec % 60}초` : ''}</span></div>
        <div class="big">${sm.total} / ${sm.n}점 (${pct}%)</div>
        ${sm.pending ? `<p class="small">영작 ${sm.pending}문제의 절 0.5점은 월요일 채점에서 더해질 수 있습니다. 최대 ${sm.total + sm.pending * 0.5}점.</p>` : ''}
        <div class="kv">${['A', 'B', 'C', 'D'].filter(k => sm.by[k]).map(k => `<b>${k} ${({ A: '뜻 보고 쓰기', B: '빈칸 채우기', C: '패턴 영작', D: '업그레이드' })[k]}</b><span>${sm.by[k].s}/${sm.by[k].n} (${Math.round(sm.by[k].s / sm.by[k].n * 100)}%)</span>`).join('')}</div>
        <div class="row" style="margin-top:10px">
          <button id="copy">답 복사 (구글 문서용)</button>
          <button id="push" ${S.token ? '' : 'disabled title="설정에서 토큰을 넣으면 비공개 저장소에 저장됩니다"'}>저장소에 저장</button>
          <button class="ghost" id="redo">답 고치기</button>
        </div>
        ${S.token ? '' : '<p class="help">저장소 저장은 설정에서 토큰을 넣은 뒤 쓸 수 있습니다. 지금은 이 기기에만 저장돼 있습니다.</p>'}
      </div>
      <div class="card">${t.questions.map(q => { const g = rec.grading[q.no]; const cls = g.score === 1 ? 'good' : g.score ? 'half' : 'bad';
        return `<div class="q"><div class="qp"><span class="no">${q.no}.</span><span class="pill gray">${q.type}</span> ${esc(q.prompt)}</div>
          <div class="small">내 답: ${rec.answers[q.no] ? esc(rec.answers[q.no]) : '<span class="muted">(빈칸)</span>'}</div>
          <div class="result ${cls}"><b>${g.score}${g.pending ? ' + 대기 0.5' : ''}점</b>${g.reason ? ` · ${esc(g.reason)}` : ''} · 정답 <b>${esc(q.answer)}</b>${q.accept?.length ? ` <span class="muted">(허용: ${esc(q.accept.join(' / '))})</span>` : ''}
            ${q.note ? `<div class="small muted">${esc(q.note)}</div>` : ''}</div>
        </div>`; }).join('')}</div>
      <p class="small muted">${esc(t.grading_rule)}</p>`;
    $('#copy').onclick = async () => {
      const txt = t.questions.map(q => `${q.no}. 답: ${rec.answers[q.no] || ''}`).join('\n');
      try { await navigator.clipboard.writeText(txt); toast('복사했습니다. 구글 문서 주간시험에 붙이세요'); } catch { prompt('복사해서 쓰세요', txt); }
    };
    $('#redo').onclick = () => { if (confirm('제출을 취소하고 답을 고칩니다. 즉시 채점 결과는 지워집니다.')) { rec.submitted = null; rec.grading = null; save(); pageTest(t.date); } };
    $('#push').onclick = async () => {
      $('#push').disabled = true;
      try {
        const payload = { test_date: t.date, source: '사이트 입력', submitted_at: rec.submitted, elapsed_sec: rec.elapsedSec || null, answers: rec.answers,
          site_grading: Object.fromEntries(t.questions.map(q => [q.no, rec.grading[q.no]])), site_total: sm.total, site_pending: sm.pending };
        await putPrivate(`answers/${t.date}.json`, JSON.stringify(payload, null, 2), `주간시험 ${t.date} 답 (사이트)`);
        toast('비공개 저장소에 저장했습니다');
      } catch (e) { toast(`저장 실패: ${e.message}`); }
      $('#push').disabled = false;
    };
  }

  // ---------- 성적 ----------
  function parseCSV(text) {
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) { const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch; }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    const [h, ...body] = rows.filter(r => r.length > 1); return body.map(r => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ''])));
  }
  async function pageScores() {
    let official = null, err = '';
    if (S.token) { try { const csv = await readPrivate('results.csv'); if (csv) official = parseCSV(csv); } catch (e) { err = e.message; } }
    const tests = INDEX.tests.slice().reverse();
    const rows = [];
    for (const d of tests) {
      const t = await getJSON(`data/tests/${d}.json`);
      const loc = S.tests[d]?.grading ? summarize(t, S.tests[d].grading) : null;
      let off = null;
      if (official) { const rs = official.filter(r => r['시험일'] === d); if (rs.length) { off = { n: rs.length, total: rs.reduce((a, r) => a + (parseFloat(r['점수']) || 0), 0), status: rs[0]['상태'] || '정식', by: {} };
        rs.forEach(r => { const k = r['유형']; off.by[k] = off.by[k] || { s: 0, n: 0 }; off.by[k].s += parseFloat(r['점수']) || 0; off.by[k].n++; }); } }
      rows.push({ d, t, loc, off });
    }
    const pct = (s, n) => n ? `${Math.round(s / n * 100)}%` : '-';
    const typeCell = (by, k) => by?.[k] ? `${pct(by[k].s, by[k].n)} <span class="muted small">${by[k].s}/${by[k].n}</span>` : '-';
    const latest = rows.find(r => r.off || r.loc);
    const used = Object.keys(S.used).length;
    const old = INDEX.expressions ? (await getJSON('data/expressions.json')).filter(e => daysBetween(e.learned, todayStr()) > 28).length : 0;
    app.innerHTML = `<h1>성적표</h1>
      ${latest ? `<div class="card soft">${(() => { const r = latest; const src = r.off || r.loc; const label = r.off ? (r.off.status === '정식' ? '정식 채점' : `${r.off.status} 채점`) : '즉시 채점(이 기기)';
        return `<div class="row between"><b>${fmtDate(r.d)} 시험</b><span class="pill ${r.off?.status === '정식' ? 'good' : 'warn'}">${label}</span></div>
          <div class="big">${src.total} / ${src.n}점 (${pct(src.total, src.n)})</div>
          <div class="kv">${['A', 'B', 'C', 'D'].map(k => `<b>${k} ${({ A: '뜻 보고 쓰기', B: '빈칸 채우기', C: '패턴 영작', D: '업그레이드' })[k]}</b><span>${typeCell(src.by, k)}</span>`).join('')}</div>`; })()}</div>` : '<p class="muted">아직 채점된 시험이 없습니다.</p>'}
      <h2>시험별</h2><div class="card"><table><thead><tr><th>시험</th><th class="num">점수</th><th class="num">A</th><th class="num">B</th><th class="num">C</th><th class="num">D</th><th>상태</th></tr></thead><tbody>
        ${rows.map(r => { const src = r.off || r.loc; if (!src) return `<tr><td><a href="#/test/${r.d}">${fmtDate(r.d)}</a></td><td colspan="6" class="muted">미응시</td></tr>`;
          return `<tr><td><a href="#/test/${r.d}">${fmtDate(r.d)}</a></td><td class="num"><b>${pct(src.total, src.n)}</b><br><span class="muted small">${src.total}/${src.n}</span></td>
            ${['A', 'B', 'C', 'D'].map(k => `<td class="num">${src.by?.[k] ? pct(src.by[k].s, src.by[k].n) : '-'}</td>`).join('')}
            <td><span class="pill ${r.off?.status === '정식' ? 'good' : 'warn'}">${r.off ? r.off.status : '즉시'}</span>${r.off && r.loc ? `<br><span class="small muted">기기 ${r.loc.total}</span>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div>
      <h2>지표</h2><div class="card"><table><tbody>
        <tr><td>주간 정답률</td><td class="num">${latest ? pct((latest.off || latest.loc).total, (latest.off || latest.loc).n) : '-'}</td><td class="muted small">4주 평균은 시험 2회부터</td></tr>
        <tr><td>유지율</td><td class="num">-</td><td class="muted small">2주 넘게 지난 표현 재출제부터</td></tr>
        <tr><td>오답 회복률</td><td class="num">-</td><td class="muted small">오답 재출제부터</td></tr>
        <tr><td>실전 사용률</td><td class="num">${old ? pct(used, old) : '-'}</td><td class="muted small">썼음 ${used}개 / 4주 넘은 표현 ${old}개</td></tr>
      </tbody></table></div>
      ${official ? `<h2>틀린 이유 (정식·예비 기록)</h2><div class="card"><table><tbody>${Object.entries(official.filter(r => parseFloat(r['점수']) < 1).reduce((m, r) => { const k = r['틀린 이유'] || '기타'; m[k] = (m[k] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <p class="help">${S.token ? (err ? `비공개 저장소 읽기 실패: ${esc(err)}` : '정식 채점(월요일 16:30, results.csv)과 이 기기의 즉시 채점을 함께 보여 줍니다.') : '설정에서 토큰을 넣으면 월요일 정식 채점 결과(비공개 저장소)도 함께 봅니다. 지금은 이 기기의 즉시 채점만 보입니다.'}</p>`;
  }
  function daysBetween(a, b) { if (!a || !b) return 0; return Math.round((new Date(b) - new Date(a)) / 86400000); }

  // ---------- 사전 ----------
  async function pageDict() {
    const all = await getJSON('data/expressions.json');
    let filter = 'all', query = '';
    const draw = () => {
      const q = query.trim().toLowerCase();
      const list = all.filter(e => (filter === 'all' || (filter === 'wrong' ? e.wrong : filter === 'used' ? S.used[e.expression] : e.kind === filter))
        && (!q || e.expression.toLowerCase().includes(q) || e.meaning.toLowerCase().includes(q) || (e.topic || '').includes(q)))
        .sort((a, b) => b.learned.localeCompare(a.learned) || a.expression.localeCompare(b.expression));
      $('#dict-list').innerHTML = list.length ? list.map(e => `<div class="dict-row">
          <div class="row"><span class="e grow">${esc(e.expression)} <span class="muted small">${esc(e.pos || '')}</span></span>${speakBtn(e.expression)}
            <button class="tiny ${S.used[e.expression] ? 'primary' : ''} used-btn" data-e="${esc(e.expression)}">${S.used[e.expression] ? `썼음 ${S.used[e.expression].slice(5)}` : '썼음'}</button></div>
          <div class="m">${esc(e.meaning)}</div>
          <div class="meta">${esc(e.kind)} · ${esc(e.topic)} · ${fmtDate(e.learned)} 배움 · ${daysBetween(e.learned, todayStr())}일 경과 ${e.wrong ? '<span class="pill bad">오답</span>' : ''}</div>
        </div>`).join('') : '<p class="muted">없습니다.</p>';
      $('#dict-count').textContent = `${list.length}개`;
      app.querySelectorAll('.used-btn').forEach(b => b.onclick = () => { const e = b.dataset.e; if (S.used[e]) { if (confirm('실전 사용 기록을 지울까요?')) delete S.used[e]; } else S.used[e] = todayStr(); save(); draw(); });
    };
    app.innerHTML = `<h1>표현 사전 <span class="muted small" id="dict-count"></span></h1>
      <input type="text" id="dict-q" placeholder="영어·뜻·주제 검색" autocapitalize="off">
      <div class="chips">${[['all', '전체'], ['단어', '단어'], ['패턴', '패턴'], ['wrong', '오답'], ['used', '썼음']].map(([k, l]) => `<button class="chip ${k === 'all' ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      <div class="card" id="dict-list"></div>
      <p class="help">"썼음"은 실제 메일·대화에서 그 표현을 처음 쓴 날을 기록합니다(실전 사용률 지표). 이 기기에 저장됩니다.</p>`;
    $('#dict-q').addEventListener('input', e => { query = e.target.value; draw(); });
    app.querySelectorAll('.chip').forEach(c => c.onclick = () => { filter = c.dataset.f; app.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c)); draw(); });
    draw();
  }

  // ---------- 브리핑 ----------
  let briefRun = null;
  async function pageBrief(arg) {
    const dates = INDEX.briefings; if (!dates.length) { app.innerHTML = '<p class="muted">브리핑이 없습니다.</p>'; return; }
    const date = dates.includes(arg) ? arg : latestOnOrBefore(dates, todayStr());
    const i = dates.indexOf(date);
    const b = await getJSON(`data/briefings/${date}.json`);
    const isHead = p => /^(Part (one|two|three|four|five|six|seven)\.|Number (one|two|three)\.)/.test(p);
    app.innerHTML = `<div class="datenav">
        <a class="btn" href="#/brief/${dates[i - 1] || date}" ${i === 0 ? 'style="visibility:hidden"' : ''}>‹ 이전</a>
        <span class="d">${fmtDate(date)} 브리핑</span>
        <a class="btn" href="#/brief/${dates[i + 1] || date}" ${i === dates.length - 1 ? 'style="visibility:hidden"' : ''}>다음 ›</a></div>
      <p class="small muted">${esc(b.written_at || '')} 작성 · ${b.paragraphs.length}문단 · 영어 음성으로 재생합니다. "..."에서는 따라 말할 시간을 줍니다.</p>
      <div class="sticky-ctl row">
        <button class="primary" id="play">▶ 처음부터</button><button id="pause">∥ 일시정지</button><button id="stop">■ 정지</button>
        <select id="rate" style="width:auto"><option value="0.75">느리게</option><option value="0.9">보통</option><option value="1">빠르게</option></select>
        <button class="tiny" id="sound-test">소리 테스트</button><button class="tiny" id="diag">진단</button><button class="tiny" id="bypass">무음 우회: ${S.silentBypass ? "켜짐" : "꺼짐"}</button>
      </div>
      <p class="small muted" id="brief-status">정지</p>
      <div class="card" id="paras">${b.paragraphs.map((p, k) => `<div class="para ${isHead(p) ? 'heading' : ''}" data-k="${k}">${esc(p)}</div>`).join('')}</div>
      ${b.korean_summary ? `<div class="card warn small">${esc(b.korean_summary)}</div>` : ''}
      <p class="help">문단을 누르면 거기부터 재생합니다. 아이폰은 무음 스위치가 켜져 있거나 화면이 꺼지면 소리가 나지 않습니다. 재생 중에는 화면을 켜 두세요.</p>`;
    $('#rate').value = String(S.rate || 0.9);
    $('#rate').onchange = e => { S.rate = parseFloat(e.target.value); save(); };
    const paras = b.paragraphs;
    const mark = k => { app.querySelectorAll('.para').forEach(p => p.classList.toggle('now', Number(p.dataset.k) === k)); const el = $(`.para[data-k="${k}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    const status = msg => { const el = $('#brief-status'); if (el) el.textContent = msg; };
    let watchdog = null;
    function playFrom(k) {
      if (briefRun) briefRun.stop = true;           // 이전 재생의 onend가 이어 말하지 않게
      const run = briefRun = { k, stop: false };
      status('재생 준비…');
      const next = () => {
        if (run.stop) return;
        if (run.k >= paras.length) { mark(-1); status('끝'); return; }
        mark(run.k);
        const chunks = paras[run.k].split(/\s*\.\.\.(?:\s*\.\.\.)*\s*/).filter(Boolean);
        let ci = 0;
        const speakChunk = () => {
          if (run.stop) return;
          if (ci >= chunks.length) { run.k++; next(); return; }
          const txt = chunks[ci++]; const pauseAfter = ci < chunks.length || /\.\.\./.test(paras[run.k]);
          clearTimeout(watchdog);
          watchdog = setTimeout(() => { if (!run.stop && Date.now() - lastSpeakStart > 3500) status('소리가 나지 않습니다. 아이폰 측면 무음 스위치를 끄고 볼륨을 올린 뒤 다시 누르세요. 그래도 안 되면 설정 탭에서 다른 음성을 골라 보세요.'); }, 4000);
          speak(txt, {
            onstart: () => { clearTimeout(watchdog); status(`재생 중 ${run.k + 1}/${paras.length}`); },
            onend: () => { if (run.stop) return; if (pauseAfter) { status(`따라 말하기… (${run.k + 1}/${paras.length})`); setTimeout(speakChunk, 2500); } else speakChunk(); },
            onerror: e => { status(`음성 오류: ${e.error}`); },
          });
        };
        speakChunk();
      };
      next();
    }
    $('#play').onclick = () => playFrom(0);
    $('#pause').onclick = () => { if (!('speechSynthesis' in window)) return; if (speechSynthesis.paused) { speechSynthesis.resume(); $('#pause').textContent = '∥ 일시정지'; } else { speechSynthesis.pause(); $('#pause').textContent = '▶ 이어서'; } };
    $('#stop').onclick = () => { if (briefRun) briefRun.stop = true; clearTimeout(watchdog); stopSpeak(); audioRelease(); mark(-1); status('정지'); };
    $('#bypass').onclick = () => { S.silentBypass = !S.silentBypass; save(); if (!S.silentBypass) audioRelease(); $('#bypass').textContent = `무음 우회: ${S.silentBypass ? '켜짐' : '꺼짐'}`; status(S.silentBypass ? '무음 우회 켜짐: 무음 스위치가 켜져 있어도 소리를 내 보려는 시도입니다' : '무음 우회 꺼짐'); };
    $('#sound-test').onclick = () => { if (briefRun) briefRun.stop = true; status('소리 테스트…'); speak('This is a sound test. If you can hear this, the briefing will work.', { onstart: () => status('소리 테스트 재생 중'), onend: () => status('소리 테스트 끝') }); };
    $('#diag').onclick = () => {
      if (briefRun) briefRun.stop = true;
      const ss = 'speechSynthesis' in window ? speechSynthesis : null;
      const vs = ss ? ss.getVoices() : [];
      const ev = [];
      const t0 = Date.now();
      const report = () => {
        const r = [
          `기기: ${navigator.userAgent.replace(/Mozilla\/5.0 \(/, '').slice(0, 70)}`,
          `홈화면 앱: ${window.navigator.standalone ? '예' : '아니오'}`,
          `음성 합성 지원: ${ss ? '예' : '아니오'} · 설치 음성 ${vs.length}개 · 영어 ${vs.filter(v => /^en/i.test(v.lang)).length}개`,
          `선택 음성: ${voice ? voice.name + ' (' + voice.lang + ')' : '없음(기본)'}`,
          `상태: speaking=${ss ? ss.speaking : '-'} pending=${ss ? ss.pending : '-'} paused=${ss ? ss.paused : '-'}`,
          `이벤트: ${ev.join(' → ') || '없음(3초 동안 시작 신호 없음)'}`,
          `볼륨/무음: 브라우저로는 확인 불가. 화면 맨 위에 종에 빗금 아이콘이 있으면 무음 모드 → 꺼야 소리가 남`,
        ].join('\n');
        status(r);
        const el = $('#brief-status'); if (el) el.style.whiteSpace = 'pre-wrap';
        try { navigator.clipboard.writeText(r); toast('진단 결과를 복사했습니다. 채팅에 붙여 넣으세요'); } catch {}
      };
      if (!ss) { report(); return; }
      if (ss.paused) ss.resume(); audioUnlock();
      // 1) 선택 음성으로, 2) 2초 뒤에도 시작 신호가 없으면 기본 음성·짧은 문장으로 한 번 더
      const u = new SpeechSynthesisUtterance('Testing one two three.');
      u.lang = 'en-US'; if (voice) u.voice = vs.find(v => v.voiceURI === voice.voiceURI) || null; u.rate = 1; u.volume = 1;
      u.onstart = () => ev.push(`시작(${Date.now() - t0}ms)`); u.onend = () => ev.push('끝'); u.onerror = e => ev.push(`오류:${e.error}`);
      utterKeep.push(u);
      if (ss.speaking || ss.pending) ss.cancel();
      setTimeout(() => ss.speak(u), 150);
      setTimeout(() => {
        if (!ev.some(x => x.startsWith('시작'))) {
          const u2 = new SpeechSynthesisUtterance('Hello'); u2.lang = 'en-US'; u2.volume = 1;
          u2.onstart = () => ev.push('기본음성 시작'); u2.onend = () => ev.push('기본음성 끝'); u2.onerror = e => ev.push(`기본음성 오류:${e.error}`);
          utterKeep.push(u2); ss.cancel(); setTimeout(() => ss.speak(u2), 150);
          setTimeout(report, 2500);
        } else report();
      }, 2500);
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden && briefRun && !briefRun.stop) status('화면이 꺼지면 아이폰은 재생을 멈춥니다. 다시 열고 문단을 누르세요.'); });
    app.querySelectorAll('.para').forEach(p => p.onclick = () => playFrom(Number(p.dataset.k)));
  }

  // ---------- 설정 ----------
  async function pageSettings() {
    const doneDays = Object.keys(S.done).filter(d => S.done[d]).length;
    app.innerHTML = `<h1>설정</h1>
      <div class="card"><h3 style="margin-top:0">비공개 저장소 연결 (선택)</h3>
        <p class="small">시험 답과 정식 채점 결과는 비공개 저장소 <code>${esc(S.privRepo)}</code>의 <code>${esc(S.privPath)}/</code>에 둡니다. 토큰이 있으면 사이트에서 답을 그 저장소에 저장하고 월요일 정식 채점 결과도 읽어 옵니다.</p>
        <p class="small">GitHub에서 Fine-grained personal access token을 만들어 붙이세요. 권한은 <b>이 저장소 하나</b>, <b>Contents: Read and write</b>만. 토큰은 이 기기 브라우저에만 저장됩니다.</p>
        <label class="small muted">저장소 (owner/repo)</label><input type="text" id="repo" value="${esc(S.privRepo)}" autocapitalize="off">
        <label class="small muted">폴더</label><input type="text" id="path" value="${esc(S.privPath)}" autocapitalize="off">
        <label class="small muted">토큰</label><input type="password" id="token" value="${esc(S.token)}" placeholder="github_pat_…" autocapitalize="off" autocomplete="off">
        <div class="row" style="margin-top:10px"><button class="primary" id="save-token">저장</button><button id="test-token">연결 확인</button><button class="ghost" id="clear-token">토큰 지우기</button></div>
        <p class="small" id="token-status"></p>
      </div>
      <div class="card"><h3 style="margin-top:0">음성</h3>
        <label class="small muted">영어 음성 (품질 높은 순)</label>
        <select id="voice-sel"><option value="">자동 (가장 좋은 음성)</option>${englishVoices().map(v => `<option value="${esc(v.voiceURI)}" ${S.voiceURI === v.voiceURI ? 'selected' : ''}>${esc(voiceLabel(v))}</option>`).join('')}</select>
        <p class="small muted">지금 쓰는 음성: ${voice ? esc(voiceLabel(voice)) : '없음'} · 영어 음성 ${englishVoices().length}개</p>
        <div class="row"><button data-say="Could you confirm whether the price includes delivery? I'm following up on the quote I asked for.">시험 재생</button>
          <select id="rate2" style="width:auto"><option value="0.75">느리게</option><option value="0.9">보통</option><option value="1">빠르게</option></select></div>
        <details style="margin-top:8px"><summary>더 자연스러운 음성 내려받기</summary>
          <p class="small">iPhone: 설정 › 손쉬운 사용 › 콘텐츠 말하기(또는 음성 콘텐츠) › 음성 › 영어 › <b>Ava</b> 또는 <b>Zoe</b>의 <b>프리미엄</b>(또는 Samantha 향상) 내려받기. 내려받은 뒤 이 페이지를 새로 고치면 목록에 "프리미엄"으로 나타나고 자동으로 선택됩니다.</p>
          <p class="small">Mac: 시스템 설정 › 손쉬운 사용 › 음성 콘텐츠 › 시스템 음성 › 관리에서 영어 프리미엄 음성 내려받기. Chrome에서는 "Google US English"도 쓸 만합니다.</p>
          <p class="small muted">음성은 기기에 설치된 것만 쓸 수 있습니다. 홈 화면 앱으로 열었을 때 목록이 비면 Safari에서 한 번 열어 보세요.</p>
        </details>
      </div>
      <div class="card"><h3 style="margin-top:0">이 기기의 기록</h3>
        <p class="small">학습 완료 ${doneDays}일 · 시험 ${Object.keys(S.tests).length}회 · 실전 사용 ${Object.keys(S.used).length}개</p>
        <div class="row"><button id="export">기록 내보내기 (JSON)</button><button id="import">기록 불러오기</button><button class="ghost" id="wipe">기록 지우기</button></div>
        <input type="file" id="import-file" accept="application/json" hidden>
        <p class="help">기록은 브라우저에만 있습니다. 폰을 바꾸거나 브라우저 데이터를 지우면 사라지니 가끔 내보내 두세요.</p>
      </div>
      <div class="card"><h3 style="margin-top:0">홈 화면에 추가</h3>
        <p class="small">iPhone Safari: 공유 버튼 › "홈 화면에 추가". 앱처럼 열립니다.</p>
        <p class="small muted">데이터 갱신 ${esc(INDEX.generated || '')} · 카드 ${INDEX.cards.length} · 시험 ${INDEX.tests.length} · 브리핑 ${INDEX.briefings.length} · 표현 ${INDEX.expressions}</p>
      </div>`;
    $('#rate2').value = String(S.rate || 0.9); $('#rate2').onchange = e => { S.rate = parseFloat(e.target.value); save(); };
    $('#voice-sel').onchange = e => { S.voiceURI = e.target.value; save(); pickVoice(); toast(voice ? `음성: ${voice.name}` : '음성 없음'); pageSettings(); };
    $('#save-token').onclick = () => { S.privRepo = $('#repo').value.trim(); S.privPath = $('#path').value.trim().replace(/\/+$/, ''); S.token = $('#token').value.trim(); save(); toast('저장했습니다'); };
    $('#clear-token').onclick = () => { S.token = ''; save(); $('#token').value = ''; toast('토큰을 지웠습니다'); };
    $('#test-token').onclick = async () => { S.privRepo = $('#repo').value.trim(); S.privPath = $('#path').value.trim(); S.token = $('#token').value.trim(); save();
      const st = $('#token-status'); st.textContent = '확인 중…';
      try { const f = await gh(`${S.privPath}/results.csv`); st.textContent = f ? `연결됨. results.csv ${Math.round(f.size / 1024 * 10) / 10}KB` : '연결됨. results.csv는 아직 없음'; }
      catch (e) { st.textContent = `실패: ${e.message}`; } };
    $('#export').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ ...S, token: '' }, null, 2)], { type: 'application/json' })); a.download = `english-lab-기록_${todayStr()}.json`; a.click(); };
    $('#import').onclick = () => $('#import-file').click();
    $('#import-file').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); const tok = S.token; S = Object.assign({}, defaults, j, { token: tok }); save(); toast('불러왔습니다'); pageSettings(); } catch { toast('파일을 읽지 못했습니다'); } };
    $('#wipe').onclick = () => { if (confirm('이 기기의 학습·시험 기록을 모두 지웁니다. 토큰도 지워집니다.')) { S = Object.assign({}, defaults); save(); toast('지웠습니다'); pageSettings(); } };
  }

  render();
})();
