// ═══ 빈슐랭 로드 — App ═══
const KAKAO_JS_KEY = '2a490d9cb03103dc9daa7549d4159c01';

// 카카오 SDK 초기화
function initKakao() {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_JS_KEY);
  }
}

// ═══ 출발 일시 한국어 표기 ═══
function formatDepartureKo(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const min = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 || 12;
  const minStr = min === 0 ? '' : ` ${min}분`;
  return `${y}년 ${m}월 ${day}일 ${ampm} ${h12}시${minStr}`;
}

// ═══ 현재 시간 한국어 표기 ═══
function formatNowKo() {
  const d = new Date();
  const w = ['일','월','화','수','목','금','토'][d.getDay()];
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const min = d.getMinutes();
  const sec = d.getSeconds();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 || 12;
  const pad = n => String(n).padStart(2,'0');
  return `현재 ${y}.${pad(m)}.${pad(day)} (${w}) ${ampm} ${pad(h12)}:${pad(min)}:${pad(sec)}`;
}

// ═══ D-Day ═══
function calcDday() {
  const target = new Date(window.DATA.META.startDateTime || window.DATA.META.startDate);
  const now = new Date();
  const diffMs = target - now;
  if (diffMs > 0) {
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `D-DAY ${days}일 ${hours}시간 ${mins}분 ${secs}초 남음`;
  }
  const after = Math.abs(diffMs);
  const days = Math.floor(after / 86400000);
  const hours = Math.floor((after % 86400000) / 3600000);
  const mins = Math.floor((after % 3600000) / 60000);
  const secs = Math.floor((after % 60000) / 1000);
  if (days > 0) return `D+DAY ${days}일 ${hours}시간 ${mins}분 ${secs}초 경과`;
  return `D-DAY ${hours}시간 ${mins}분 ${secs}초 경과`;
}
function startDdayCountdown() {
  const update = () => {
    const txt = calcDday();
    document.querySelectorAll('.dday-text').forEach(el => el.textContent = txt);
    const nowTxt = formatNowKo();
    document.querySelectorAll('.now-text').forEach(el => el.textContent = nowTxt);
  };
  update();
  setInterval(update, 1000); // 1초마다
}

// ═══ 라우팅 ═══
const VIEWS = ['intro', 'menu', 'a', 'b', 'compare', 'return', 'facilities'];
let currentView = 'intro';

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.querySelector(`.view-${name}`);
  if (target) target.classList.add('active');
  currentView = name;
  window.scrollTo({ top: 0, behavior: 'instant' });

  // 메뉴/플랜 뷰에서는 음악 시작 (사용자가 ENTER 누른 후)
  if (name !== 'intro' && bgmReady) {
    playBgm();
  }
  // 플랜 뷰는 지도 초기화 + 선택 UI 동기화
  if (name === 'a' || name === 'b') {
    const code = name.toUpperCase();
    setTimeout(() => { initPlanMaps(code); updateSelectionUI(code); }, 100);
  }
  if (name === 'compare') {
    setTimeout(() => { updateCompareUI(); updateReturnUI(); }, 100);
  }
  if (name === 'return') {
    setTimeout(() => updateReturnUI(), 100);
  }
  if (name === 'facilities') {
    setTimeout(() => renderFacilities(), 100);
  }
}

function router() {
  const hash = location.hash.replace('#', '') || 'intro';
  if (VIEWS.includes(hash)) showView(hash);
}

// ═══ 음악 ═══
let bgm = null;
let bgmReady = false;
let isMuted = false;

function setupBgm() {
  bgm = document.getElementById('bgm');
  if (!bgm) return;
  bgm.volume = 0.4;
}

function playBgm() {
  if (!bgm || isMuted) return;
  bgm.play().catch(e => {/* iOS 자동재생 차단 시 조용히 무시 */});
}

function toggleMute() {
  if (!bgm) return;
  isMuted = !isMuted;
  bgm.muted = isMuted;
  if (!isMuted) bgm.play().catch(()=>{});
  document.querySelectorAll('.music-toggle').forEach(b => {
    b.textContent = isMuted ? '🔇' : '🔊';
  });
}

// ═══ 인트로 영상 ═══
function setupIntro() {
  const video = document.getElementById('intro-video');
  const enterBtn = document.getElementById('intro-enter');
  const skipBtn = document.getElementById('intro-skip');
  const introView = document.querySelector('.view-intro');

  // ENTER 누르면 영상 시작 (영상 자체 음악 ON, BGM은 영상 끝난 후)
  function startIntro() {
    introView.classList.add('playing');
    if (video) {
      video.muted = false;       // ★ 영상 자체 음악 ON
      video.volume = 1.0;
      video.currentTime = 0;
      video.play().catch(()=>{});
      video.addEventListener('ended', endIntro, { once: true });
    } else {
      setTimeout(endIntro, 5000);
    }
  }

  function endIntro() {
    if (video) video.muted = true;  // 영상 정지/메뉴 이동 시 영상 소리 OFF
    bgmReady = true;
    playBgm();                       // 메뉴부터 BGM 시작
    location.hash = 'menu';
  }

  if (enterBtn) enterBtn.addEventListener('click', startIntro);
  if (skipBtn) skipBtn.addEventListener('click', endIntro);
}

// ═══ 메뉴 화면 ═══
function renderMenu() {
  const root = document.querySelector('.view-menu');
  if (!root) return;
  const D = window.DATA;
  const dday = calcDday();

  root.innerHTML = `
    <div class="menu-hero">
      <div class="menu-brand latin">BIN MICHELIN ROAD</div>
      <h1 class="menu-title serif">${D.META.title}</h1>
      <div class="menu-divider"></div>
      <div class="menu-sub">${D.META.subtitle}  ·  ${D.META.startDate.replace(/-/g, '. ')} ~ ${D.META.endDate.slice(-2)}</div>
      <div class="menu-depart">${formatDepartureKo(D.META.startDateTime)} 출발</div>
      <div class="menu-now now-text">${formatNowKo()}</div>
      <div class="menu-dday-big dday-text">${dday}</div>
    </div>

    <div class="menu-banners">
      ${renderBanner('A', D.PLANS.A, false)}
      ${renderBanner('B', D.PLANS.B, false)}
      ${renderCompareBanner()}
      ${renderFacilitiesBanner()}
    </div>

    <div class="menu-footer">
      <a href="${D.NAVER(D.META.pension.name + ' 안면도')}" target="_blank" rel="noopener" class="pension-mini-link">
        <div class="pension-mini serif">${D.META.pension.name} ↗</div>
        <div>${D.META.pension.addr}  ·  체크인 ${D.META.pension.checkin}</div>
      </a>
      <div style="margin-top:24px;">
        <button class="share-btn" onclick="shareToKakao()">
          <span>💬</span> 카카오톡으로 공유
        </button>
      </div>
      <div style="margin-top:20px; font-size:10px;">
        TRAVEL  ·  PLAN  ·  ${D.META.startDate.split('-')[0]}
      </div>
    </div>
  `;
}

function renderBanner(code, plan, recommend) {
  return `
    <a href="#${code.toLowerCase()}" class="banner">
      ${recommend ? '<div class="banner-recommend">★ 추천</div>' : ''}
      <div class="banner-tag">PLAN ${code}</div>
      <div class="banner-title serif">${plan.title}</div>
      <div class="banner-sub">${plan.subtitle}</div>
      <div class="banner-stats">
        <div class="banner-stat">
          <div class="banner-stat-num">${plan.kpi.km}<span style="font-size:14px;color:var(--text-mid);">km</span></div>
          <div class="banner-stat-label">거리</div>
        </div>
        <div class="banner-stat">
          <div class="banner-stat-num">${plan.kpi.min}<span style="font-size:14px;color:var(--text-mid);">분</span></div>
          <div class="banner-stat-label">시간</div>
        </div>
        <div class="banner-stat">
          <div class="banner-stat-num">${plan.kpi.toll === 0 ? '0' : plan.kpi.toll.toLocaleString()}<span style="font-size:14px;color:var(--text-mid);">원</span></div>
          <div class="banner-stat-label">통행료</div>
        </div>
      </div>
      <div class="banner-arrow">→</div>
    </a>
  `;
}

function renderFacilitiesBanner() {
  const cnt = (window.DATA.NEARBY_FACILITIES || []).length;
  return `
    <a href="#facilities" class="banner">
      <div class="banner-tag">FACILITIES</div>
      <div class="banner-title serif">펜션 주변 편의시설</div>
      <div class="banner-sub">편의점·마트·주유소·약국·병원·ATM 한눈에</div>
      <div class="banner-stats" style="border-top:none; padding-top:0;">
        <div style="display:flex; gap:10px; align-items:center; font-size:13px;">
          <span style="color:#16A085;">🏪 편의점</span>
          <span style="color:#1F618D;">🛒 마트</span>
          <span style="color:#D35400;">⛽ 주유</span>
          <span style="color:#C0392B;">🏥 응급</span>
          <span style="color:var(--text-low); margin-left:6px;">총 ${cnt}곳</span>
        </div>
      </div>
      <div class="banner-arrow">→</div>
    </a>
  `;
}

function renderCompareBanner() {
  return `
    <a href="#compare" class="banner">
      <div class="banner-tag">COMPARE</div>
      <div class="banner-title serif">Trip A vs Trip B</div>
      <div class="banner-sub">무엇이 더 좋을까?  핵심 8개 항목 비교</div>
      <div class="banner-stats" style="border-top:none; padding-top:0;">
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="color:var(--accent-a); font-weight:700; font-size:13px;">Trip A</span>
          <span style="color:var(--text-low);">vs</span>
          <span style="color:var(--accent-b); font-weight:700; font-size:13px;">Trip B</span>
          <span style="color:var(--text-low); font-size:11px; margin-left:8px;">한눈에 비교</span>
        </div>
      </div>
      <div class="banner-arrow">→</div>
    </a>
  `;
}

// ═══ 플랜 페이지 (A/B 공통) ═══
function renderPlan(code) {
  const view = document.querySelector(`.view-${code.toLowerCase()}`);
  if (!view) return;
  const plan = window.DATA.PLANS[code];
  const D = window.DATA;

  view.innerHTML = `
    <div class="app-header">
      <button class="back-btn" onclick="location.hash='menu'">←</button>
      <div class="header-title latin">PLAN ${code}</div>
      <div class="header-actions">
        <button class="icon-btn music-toggle" onclick="toggleMute()">🔊</button>
      </div>
    </div>

    <div class="plan-hero" style="border-bottom-color:${plan.accent};">
      <div class="plan-tag">PLAN ${code}</div>
      <h1 class="plan-title serif">${plan.title}</h1>
      <div class="plan-subtitle">${plan.subtitle}</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-box">
        <div><span class="kpi-num">${plan.kpi.km}</span><span class="kpi-unit">km</span></div>
        <div class="kpi-label">DISTANCE</div>
      </div>
      <div class="kpi-box">
        <div><span class="kpi-num">${plan.kpi.min}</span><span class="kpi-unit">분</span></div>
        <div class="kpi-label">TIME</div>
      </div>
      <div class="kpi-box">
        <div><span class="kpi-num">${plan.kpi.toll.toLocaleString()}</span><span class="kpi-unit">원</span></div>
        <div class="kpi-label">TOLL</div>
      </div>
      <div class="kpi-box">
        <div><span class="kpi-num" style="font-size:22px;">${plan.kpi.arrive.split(' ')[0]}</span></div>
        <div class="kpi-label">CHECK-IN</div>
      </div>
    </div>

    <!-- 펜션 정보 -->
    <a href="${D.NAVER(D.META.pension.name + ' 안면도')}" target="_blank" rel="noopener" class="pension-card pension-card-link">
      <div class="pension-label">YOUR STAY  ·  탭하여 네이버 검색 ↗</div>
      <div class="pension-name serif">${D.META.pension.name}</div>
      <div class="pension-addr">${D.META.pension.addr}</div>
      <div class="pension-checkin">CHECK-IN ${D.META.pension.checkin}</div>
    </a>

    <!-- 광역 지도 -->
    <div class="section">
      <div class="section-num">01  ROUTE</div>
      <div class="section-title serif">광역 동선</div>
      <div class="section-sub">아산 → 안면도 펜션 (지도 클릭하면 카카오맵 열림)</div>
    </div>
    <div class="map-box" id="map-overview-${code}"></div>

    <!-- 일정 -->
    <div class="section">
      <div class="section-num">02  SCHEDULE</div>
      <div class="section-title serif">하루 일정</div>
      <div class="section-sub">15시 펜션 체크인이 메인</div>
    </div>
    <div class="schedule-list" id="schedule-${code}">
      ${renderScheduleHTML(code)}
    </div>

    <!-- 점심 카드 -->
    <div class="section" id="lunch-section-${code}">
      <div class="section-num">03  LUNCH</div>
      <div class="section-title serif">점심 옵션 (${plan.lunch.length})</div>
      <div class="section-sub">← 좌우로 슬라이드 · 식당명 클릭 = 네이버 리뷰</div>
    </div>
    <div class="cards-wrap">
      <button class="cards-nav prev" onclick="scrollCards(this,-1)" aria-label="이전">‹</button>
      <button class="cards-nav next" onclick="scrollCards(this,1)" aria-label="다음">›</button>
      <div class="cards-scroll">
        ${plan.lunch.map(it => renderCard(it, code, 'lunch')).join('')}
      </div>
    </div>

    <!-- 놀거리 카드 -->
    <div class="section" id="play-section-${code}">
      <div class="section-num">04  PLAY</div>
      <div class="section-title serif">놀거리 (${plan.play.length})</div>
      <div class="section-sub">6세 남아 위주 · 슬라이드해서 골라주세요</div>
    </div>
    <div class="cards-wrap">
      <button class="cards-nav prev" onclick="scrollCards(this,-1)" aria-label="이전">‹</button>
      <button class="cards-nav next" onclick="scrollCards(this,1)" aria-label="다음">›</button>
      <div class="cards-scroll">
        ${plan.play.map(it => renderCard(it, code, 'play')).join('')}
      </div>
    </div>

    <!-- 내 선택 합계 (수산시장 비교 직전) -->
    <div class="section" style="padding-bottom:0;">
      <div class="section-num">★  MY PICK</div>
      <div class="section-title serif">내 선택 합계</div>
      <div class="section-sub">위 점심·놀거리 카드에서 "선택" 누르면 여기에 자동 합산</div>
    </div>
    <div class="sel-summary-box" id="sel-summary-${code}">
      <div class="sel-empty">
        <div class="sel-empty-title">선택한 옵션이 없어요</div>
        <div class="sel-empty-sub">위 카드에서 점심 1개 + 놀거리 1~2개를 골라보세요 ↑</div>
      </div>
    </div>

    <!-- 수산시장 비교 -->
    <div class="section">
      <div class="section-num">05  MARKET</div>
      <div class="section-title serif">수산시장 비교</div>
      <div class="section-sub">대천항 vs 백사장항 · 한눈에 보기</div>
    </div>
    ${renderMarketCompare(code)}

    <!-- 복귀 (5/5) — 별도 페이지 링크 -->
    <div class="section">
      <div class="section-num">06  NEXT DAY</div>
      <div class="section-title serif">복귀 일정 (5/5 화)</div>
      <div class="section-sub">Trip A·Trip B 공통 — 카페·해장 등 한 페이지에 정리</div>
    </div>
    <div style="margin: 0 16px 24px;">
      <a href="#return" class="banner" style="display:block; text-decoration:none;">
        <div class="banner-tag">5/5 RETURN</div>
        <div class="banner-title serif">복귀 일정 보기</div>
        <div class="banner-sub">체크아웃 → 카페 → 길목 해장 → 집</div>
        <div class="banner-arrow">→</div>
      </a>
    </div>

    <div class="app-footer">
      <button class="share-btn" onclick="shareToKakao('${code}')">
        <span>💬</span> 내 ${code === 'A' ? 'Trip A' : 'Trip B'} 선택 결과 카톡 공유
      </button>
      ${renderHomeButton()}
      <div class="footer-meta">BIN MICHELIN ROAD  ·  ${D.META.startDate.split('-')[0]}</div>
    </div>
  `;
}

// ═══ 선택 시스템 (점심 1개 + 놀거리 1~2개) ═══
const SEL_KEY = 'binload_selection_v1';
function getSelection() {
  try { return JSON.parse(localStorage.getItem(SEL_KEY) || '{}'); }
  catch { return {}; }
}
function setSelection(s) {
  localStorage.setItem(SEL_KEY, JSON.stringify(s));
}
function toggleSelection(planCode, kind, tag) {
  const sel = getSelection();
  if (planCode === 'R') {
    // 복귀: 카페 1개 + 해장 1개 (라디오)
    if (!sel.R) sel.R = { cafe: null, haejang: null };
    sel.R[kind] = sel.R[kind] === tag ? null : tag;
    setSelection(sel);
    updateReturnUI();
    updateCompareUI();
    return;
  }
  if (!sel[planCode]) sel[planCode] = { lunch: null, play: [] };
  if (kind === 'lunch') {
    sel[planCode].lunch = sel[planCode].lunch === tag ? null : tag;
  } else {
    const arr = sel[planCode].play || [];
    if (arr.includes(tag)) {
      sel[planCode].play = arr.filter(t => t !== tag);
    } else if (arr.length < 2) {
      sel[planCode].play = [...arr, tag];
    } else {
      sel[planCode].play = [arr[1], tag];
    }
  }
  setSelection(sel);
  updateSelectionUI(planCode);
  updateCompareUI();
}
function updateReturnUI() {
  const sel = getSelection().R || {};
  document.querySelectorAll(`[data-card-plan="R"]`).forEach(c => {
    const tag = c.dataset.cardTag;
    const kind = c.dataset.cardKind;
    c.classList.toggle('card-selected', sel[kind] === tag);
  });
}
function calcReturn() {
  const sel = getSelection().R || {};
  const R = window.DATA.RETURN_DAY;
  let cost = 0, items = [];
  let extraKm = 0;
  if (sel.cafe) {
    const it = R.cafes.find(x => x.tag === sel.cafe);
    if (it) { cost += parsePrice(it.price); items.push(it); extraKm += it.km * 2; }
  }
  if (sel.haejang) {
    const it = R.haejang.find(x => x.tag === sel.haejang);
    if (it) { cost += parsePrice(it.price); items.push(it); extraKm += it.km * 2; }
  }
  // 복귀일 detour 주유비 (펜션 → 카페 → 해장 왕복)
  const fuel = Math.round((extraKm / 13) * 1700);
  return { items, cost, fuel, extraKm, totalCost: cost + fuel, sel };
}
function updateCompareUI() {
  const box = document.getElementById('compare-grand');
  const a = calcSelection('A');
  const b = calcSelection('B');
  const r = calcReturn();
  if (box) box.innerHTML = renderCompareGrand(a, b, r);
  const tbl = document.getElementById('compare-table');
  if (tbl) tbl.innerHTML = renderCompareTable(a, b, r);
}

// ═══ 비교 테이블 (선택 연동) ═══
function renderCompareTable(a, b, r) {
  const D = window.DATA;
  const fmt = n => (n/10000).toFixed(1) + '만원';
  const aTotal = a.totalCost + r.totalCost;
  const bTotal = b.totalCost + r.totalCost;
  const hasAnySel = a.items.length || b.items.length || r.items.length;
  const findName = (list, tag) => { const it = list.find(x=>x.tag===tag); return it ? `${it.tag} ${it.name}` : '미선택'; };
  const findItem = (list, tag) => list.find(x=>x.tag===tag) || null;
  const cafeName = r.sel.cafe ? findName(D.RETURN_DAY.cafes, r.sel.cafe) : '미선택';
  const haejangName = r.sel.haejang ? findName(D.RETURN_DAY.haejang, r.sel.haejang) : '미선택';

  // 선택 기반 동적 값 계산
  const aLunch = a.sel.lunch ? findItem(D.PLANS.A.lunch, a.sel.lunch) : null;
  const bLunch = b.sel.lunch ? findItem(D.PLANS.B.lunch, b.sel.lunch) : null;
  const aPlays = (a.sel.play||[]).map(t => findItem(D.PLANS.A.play, t)).filter(Boolean);
  const bPlays = (b.sel.play||[]).map(t => findItem(D.PLANS.B.play, t)).filter(Boolean);

  // 선택한 점심 카테고리 (없으면 '미선택')
  const lunchCatA = aLunch ? `${aLunch.tag} ${aLunch.name}` : '미선택';
  const lunchCatB = bLunch ? `${bLunch.tag} ${bLunch.name}` : '미선택';
  // 놀거리 — 선택한 항목명으로
  const playA = aPlays.length ? aPlays.map(p => `${p.tag} ${p.name}`).join('<br>') : '미선택';
  const playB = bPlays.length ? bPlays.map(p => `${p.tag} ${p.name}`).join('<br>') : '미선택';
  // 펜션-식당 거리 (선택 점심 km, 없으면 정적)
  const distA = aLunch ? `${aLunch.km}km · ${aLunch.min}분` : '미선택';
  const distB = bLunch ? `${bLunch.km}km · ${bLunch.min}분` : '미선택';

  // 정적 비교 행 — 선택 시 동적 값으로 덮어쓰기
  const baseRows = D.COMPARE.map(c => {
    if (c.label === '총 비용' && hasAnySel) {
      return {
        label: '총 비용 (선택 반영)',
        a: fmt(aTotal), b: fmt(bTotal),
        winner: aTotal < bTotal ? 'A' : (bTotal < aTotal ? 'B' : ''),
      };
    }
    if (c.label === '점심 다양성' && (aLunch || bLunch)) {
      return { label:'선택한 점심', a: lunchCatA, b: lunchCatB, winner:'' };
    }
    if (c.label === '아이 놀거리' && (aPlays.length || bPlays.length)) {
      return { label:'선택한 놀거리', a: playA, b: playB, winner:'' };
    }
    if (c.label === '펜션-식당 거리' && (aLunch || bLunch)) {
      const winner = (aLunch && bLunch) ? (aLunch.km < bLunch.km ? 'A' : (bLunch.km < aLunch.km ? 'B' : '')) : '';
      return { label:'펜션-식당 거리 (선택)', a: distA, b: distB, winner };
    }
    return c;
  });

  // 추가 — 복귀 옵션
  const extraRows = [
    { label:'복귀 카페 (공통)', a: cafeName, b: cafeName, winner:'' },
    { label:'복귀 해장 (공통)', a: haejangName, b: haejangName, winner:'' },
  ];

  const allRows = [...baseRows, ...extraRows];
  return `
    <div class="compare-head">
      <div>비교 항목</div>
      <div class="col-a">Trip A</div>
      <div class="col-b">Trip B</div>
    </div>
    ${allRows.map(c => `
      <div class="compare-row">
        <div>${c.label}</div>
        <div class="${c.winner==='A' ? 'winner-A' : ''}">${c.a}</div>
        <div class="${c.winner==='B' ? 'winner-B' : ''}">${c.b}</div>
      </div>
    `).join('')}
  `;
}
function parsePrice(p) {
  if (!p || p.includes('무료')) return 0;
  const m = p.match(/([\d.]+)\s*만/);
  if (m) return parseFloat(m[1]) * 10000;
  const m2 = p.match(/([\d,]+)\s*원/);
  if (m2) return parseInt(m2[1].replace(/,/g,''));
  return 0;
}
function calcSelection(planCode) {
  const sel = getSelection()[planCode] || { lunch: null, play: [] };
  const plan = window.DATA.PLANS[planCode];
  const baseKm = plan.kpi.km, baseMn = plan.kpi.min, baseToll = plan.kpi.toll;
  let extraKm = 0, extraMn = 0, totalCost = 0;
  const items = [];
  if (sel.lunch) {
    const it = plan.lunch.find(x => x.tag === sel.lunch);
    if (it) {
      extraKm += it.km * 2;  // 펜션 왕복
      extraMn += it.min * 2;
      totalCost += parsePrice(it.price);
      items.push(it);
    }
  }
  (sel.play || []).forEach(tag => {
    const it = plan.play.find(x => x.tag === tag);
    if (it) {
      extraKm += it.km * 2;
      extraMn += it.min * 2;
      totalCost += parsePrice(it.price);
      items.push(it);
    }
  });
  // 주유비 추정 (왕복 km · 13km/L · 1700원)
  const fuel = Math.round(((baseKm * 2 + extraKm) / 13) * 1700);
  return {
    sel, items,
    totalKm: baseKm * 2 + extraKm,
    totalMn: baseMn * 2 + extraMn,
    totalCost: totalCost + fuel + baseToll * 2,
    fuel, toll: baseToll * 2,
  };
}
function updateSelectionUI(planCode) {
  const r = calcSelection(planCode);
  const box = document.getElementById(`sel-summary-${planCode}`);
  if (box) {
    box.innerHTML = renderSelSummary(planCode, r);
  }
  // 일정 다시 렌더 (선택 반영)
  const sched = document.getElementById(`schedule-${planCode}`);
  if (sched) {
    sched.innerHTML = renderScheduleHTML(planCode);
  }
  // 카드 selected 상태 업데이트
  document.querySelectorAll(`[data-card-plan="${planCode}"]`).forEach(c => {
    const tag = c.dataset.cardTag;
    const kind = c.dataset.cardKind;
    const sel = r.sel;
    const isSel = (kind === 'lunch' && sel.lunch === tag) ||
                  (kind === 'play' && (sel.play || []).includes(tag));
    c.classList.toggle('card-selected', isSel);
  });
}
function renderSelSummary(planCode, r) {
  const plan = window.DATA.PLANS[planCode];
  const hasItems = r.items.length > 0;
  if (!hasItems) {
    return `
      <div class="sel-empty">
        <div class="sel-empty-title">선택한 옵션이 없어요</div>
        <div class="sel-empty-sub">점심 1개 + 놀거리 1~2개를 골라보세요 ↓</div>
      </div>
    `;
  }
  return `
    <div class="sel-stats">
      <div class="sel-stat">
        <div class="sel-stat-num">${r.totalKm.toFixed(0)}<span>km</span></div>
        <div class="sel-stat-label">총 이동거리</div>
      </div>
      <div class="sel-stat">
        <div class="sel-stat-num">${r.totalMn}<span>분</span></div>
        <div class="sel-stat-label">예상 시간</div>
      </div>
      <div class="sel-stat">
        <div class="sel-stat-num">${(r.totalCost/10000).toFixed(1)}<span>만</span></div>
        <div class="sel-stat-label">예상 총비용</div>
      </div>
    </div>
    <div class="sel-items">
      ${r.items.map(it => `
        <div class="sel-item" style="border-left-color:${it.tone};">
          <span class="sel-item-tag">${it.tag}</span>
          <span class="sel-item-name">${it.name}</span>
          <span class="sel-item-price">${it.price}</span>
        </div>
      `).join('')}
      <div class="sel-item sel-fuel">
        <span class="sel-item-tag">⛽</span>
        <span class="sel-item-name">주유 (${r.totalKm.toFixed(0)}km · 13km/L) + 톨비 ${r.toll.toLocaleString()}원</span>
        <span class="sel-item-price">${((r.fuel + r.toll)/10000).toFixed(1)}만원</span>
      </div>
    </div>
    ${renderSelCTAs(planCode, r)}
  `;
}

// 모든 페이지 공통 푸터 — "처음으로" 버튼
function renderHomeButton() {
  return `
    <a href="#menu" class="home-btn">🏠 처음 화면으로</a>
  `;
}

// 반대편 plan 선택 여부 + 비교 버튼 — 양쪽 다 있으면 비교 강조
function renderSelCTAs(planCode, r) {
  const otherCode = planCode === 'A' ? 'B' : 'A';
  const otherSel = getSelection()[otherCode] || {};
  const otherHas = !!otherSel.lunch || (otherSel.play || []).length > 0;
  const otherTitle = `Trip ${otherCode}`;

  if (otherHas) {
    // 양쪽 다 골랐으면 → 비교 페이지로
    return `
      <a href="#compare" class="sel-cta">
        <span>📊</span>
        <span>비교 페이지로 → 두 안 합산 보기</span>
      </a>
    `;
  }
  // 한쪽만 골랐으면 → 반대편 선택 유도
  return `
    <a href="#${otherCode.toLowerCase()}" class="sel-cta">
      <span>👉</span>
      <span>${otherTitle} 선택하러 가기 →</span>
    </a>
  `;
}
window.toggleSelection = toggleSelection;

// 두 좌표 사이 직선거리(km) — Haversine
function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1,lon1,lat2,lon2].some(v => v == null)) return null;
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
// 도로 거리 추정: 직선 × 1.3, 평균 50km/h
function estimateRoad(km) {
  if (km == null) return null;
  const road = km * 1.3;
  const min = Math.round((road / 50) * 60);
  return { km: road, min };
}
// schedule 항목의 좌표 (선택 반영)
function getScheduleCoord(planCode, s) {
  if (s.lat != null && s.lon != null) return [s.lat, s.lon];
  if (s.isChoice) {
    const sel = getSelection()[planCode] || {};
    if (s.target === 'lunch' && sel.lunch) {
      const it = window.DATA.PLANS[planCode].lunch.find(x => x.tag === sel.lunch);
      if (it) return [it.lat, it.lon];
    }
    if (s.target === 'play') {
      const playArr = sel.play || [];
      if (playArr.length) {
        const it = window.DATA.PLANS[planCode].play.find(x => x.tag === playArr[0]);
        if (it) return [it.lat, it.lon];
      }
    }
  }
  return null;
}

function renderScheduleHTML(planCode) {
  const plan = window.DATA.PLANS[planCode];
  const sel = getSelection()[planCode] || { lunch: null, play: [] };
  const lunchItem = sel.lunch ? plan.lunch.find(x => x.tag === sel.lunch) : null;
  const playItems = (sel.play || []).map(t => plan.play.find(x => x.tag === t)).filter(Boolean);

  // 각 row 좌표 미리 계산 (이전 좌표 추적)
  let prevCoord = null;
  return plan.schedule.map((s, idx) => {
    const curCoord = getScheduleCoord(planCode, s);
    let distHTML = '';
    if (prevCoord && curCoord) {
      const km = haversineKm(prevCoord[0], prevCoord[1], curCoord[0], curCoord[1]);
      const est = estimateRoad(km);
      if (est && est.km > 0.5) {
        distHTML = `<span class="schedule-leg">↓ 약 ${est.km.toFixed(0)}km · ${est.min}분</span>`;
      }
    }
    if (curCoord) prevCoord = curCoord;

    if (s.isChoice && s.target === 'lunch') {
      const filled = !!lunchItem;
      const place = filled
        ? `<span class="schedule-pick">✓ ${lunchItem.tag}</span> ${lunchItem.name}`
        : s.place;
      const labelTxt = filled ? '점심' : s.label;
      const cls = filled ? '' : ' choice';
      return `${distHTML}
        <div class="schedule-row choice-row${filled ? ' picked' : ''}" onclick="document.getElementById('${s.target}-section-${planCode}').scrollIntoView({behavior:'smooth', block:'start'})">
          <div class="schedule-time">${s.time}</div>
          <div class="schedule-label${cls}">${labelTxt}</div>
          <div class="schedule-place">${place}</div>
        </div>
      `;
    }
    if (s.isChoice && s.target === 'play') {
      const filled = playItems.length > 0;
      const place = filled
        ? playItems.map(p => `<span class="schedule-pick">✓ ${p.tag}</span> ${p.name}`).join(' &nbsp; ')
        : s.place;
      const labelTxt = filled ? '놀이' : s.label;
      const cls = filled ? '' : ' choice';
      return `${distHTML}
        <div class="schedule-row choice-row${filled ? ' picked' : ''}" onclick="document.getElementById('${s.target}-section-${planCode}').scrollIntoView({behavior:'smooth', block:'start'})">
          <div class="schedule-time">${s.time}</div>
          <div class="schedule-label${cls}">${labelTxt}</div>
          <div class="schedule-place">${place}</div>
        </div>
      `;
    }
    return `${distHTML}
      <div class="schedule-row">
        <div class="schedule-time">${s.time}</div>
        <div class="schedule-label">${s.label}</div>
        <div class="schedule-place">${s.place}</div>
      </div>
    `;
  }).join('');
}
window.scrollCards = function(btn, dir) {
  const wrap = btn.closest('.cards-wrap');
  const scroll = wrap.querySelector('.cards-scroll');
  const card = scroll.querySelector('.card');
  const cardW = card?.getBoundingClientRect().width || 300;
  scroll.scrollBy({ left: dir * (cardW + 16), behavior: 'smooth' });
};

// ═══ 카드 ═══
function renderCard(it, planCode, kind) {
  // 음식점·카페·해장은 사진 없음 (명시적 photo 있는 관광지만 표시)
  const photo = it.photo || '';
  const photoStyle = photo
    ? `background-image:url('${photo}'); background-color:${it.tone};`
    : `background-color:${it.tone};`;
  const fallback = photo ? '' : `<div class="card-photo-fallback">${it.name}</div>`;

  const naverUrl = it.naver || window.DATA.NAVER(it.name);
  const kmapUrl = it.url || window.DATA.KMAP(it.name);
  const selectable = planCode && kind && (kind === 'lunch' || kind === 'play' || kind === 'cafe' || kind === 'haejang');

  return `
    <div class="card" ${selectable ? `data-card-plan="${planCode}" data-card-kind="${kind}" data-card-tag="${it.tag}"` : ''}>
      <div class="card-photo" style="${photoStyle}">
        ${fallback}
        <div class="card-tag">${it.tag}</div>
        <div class="card-stars">${'★'.repeat(it.star)}${'☆'.repeat(5-it.star)}</div>
      </div>
      <div class="card-body">
        ${it.cat ? `<div class="card-cat" style="background:${it.catColor || '#444'};">${it.cat}</div>` : ''}
        <a href="${naverUrl}" target="_blank" rel="noopener" class="card-name">${it.name}</a>
        <div class="card-addr">${it.addr}</div>

        <div class="card-stats">
          <div class="stat-box">
            <div class="stat-tiny">숙소 기준</div>
            <div class="stat-num">${it.km}</div>
            <div class="stat-label">KM</div>
          </div>
          <div class="stat-box">
            <div class="stat-tiny">차로</div>
            <div class="stat-num accent">${it.min}</div>
            <div class="stat-label">분</div>
          </div>
          <div class="stat-box">
            <div class="stat-tiny">예상</div>
            <div class="stat-num price-${it.class}">${it.price}</div>
            <div class="stat-label">비용</div>
          </div>
        </div>

        <div class="card-info">
          <div class="info-row">
            <span class="info-label menu">메뉴</span>
            <span class="info-text">${it.menu}</span>
          </div>
          <div class="info-row">
            <span class="info-label review">평판</span>
            <span class="info-text">${it.review}</span>
          </div>
          <div class="info-row">
            <span class="info-label kid">6세</span>
            <span class="info-text">${it.kid}</span>
          </div>
        </div>

        <div class="card-actions">
          <a href="${naverUrl}" target="_blank" rel="noopener" class="card-action">네이버 리뷰</a>
          <a href="${kmapUrl}" target="_blank" rel="noopener" class="card-action">카카오맵</a>
          ${selectable ? `
            <button onclick="toggleSelection('${planCode}','${kind}','${it.tag}')" class="card-action primary card-pick">선택</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ═══ 복귀 페이지 (별도 뷰) ═══
function renderReturn() {
  const view = document.querySelector('.view-return');
  if (!view) return;
  const R = window.DATA.RETURN_DAY;

  view.innerHTML = `
    <div class="app-header">
      <button class="back-btn" onclick="location.hash='menu'">←</button>
      <div class="header-title latin">RETURN · 5/5</div>
      <div class="header-actions">
        <button class="icon-btn music-toggle" onclick="toggleMute()">🔊</button>
      </div>
    </div>

    <div class="plan-hero">
      <div class="plan-tag">DAY 2 · 5월 5일 (화)</div>
      <h1 class="plan-title serif">${R.title}</h1>
      <div class="plan-subtitle">${R.sub}</div>
    </div>

    <!-- Day2 일정 -->
    <div class="section">
      <div class="section-num">01  SCHEDULE</div>
      <div class="section-title serif">하루 흐름</div>
      <div class="section-sub">아침 천천히 → 카페 → 해장 → 집</div>
    </div>
    <div class="schedule-list">
      ${R.schedule.map(s => s.isChoice ? `
        <div class="schedule-row choice-row" onclick="document.getElementById('return-${s.target}-section').scrollIntoView({behavior:'smooth', block:'start'})">
          <div class="schedule-time">${s.time}</div>
          <div class="schedule-label choice">${s.label}</div>
          <div class="schedule-place">${s.place}</div>
        </div>
      ` : `
        <div class="schedule-row">
          <div class="schedule-time">${s.time}</div>
          <div class="schedule-label">${s.label}</div>
          <div class="schedule-place">${s.place}</div>
        </div>
      `).join('')}
    </div>

    <!-- 카페 -->
    <div class="section" id="return-cafe-section">
      <div class="section-num">02  CAFE</div>
      <div class="section-title serif">모닝 카페 (${R.cafes.length})</div>
      <div class="section-sub">펜션 인근 · 오션뷰·정원 · 카드의 "선택" 누르면 비교 페이지에 자동 합산</div>
    </div>
    <div class="cards-wrap">
      <button class="cards-nav prev" onclick="scrollCards(this,-1)" aria-label="이전">‹</button>
      <button class="cards-nav next" onclick="scrollCards(this,1)" aria-label="다음">›</button>
      <div class="cards-scroll">
        ${R.cafes.map(it => renderCard(it, 'R', 'cafe')).join('')}
      </div>
    </div>

    <!-- 해장 -->
    <div class="section" id="return-haejang-section">
      <div class="section-num">03  HAEJANG</div>
      <div class="section-title serif">길목 해장국 (${R.haejang.length})</div>
      <div class="section-sub">집 가는 길 · 아이도 OK</div>
    </div>
    <div class="cards-wrap">
      <button class="cards-nav prev" onclick="scrollCards(this,-1)" aria-label="이전">‹</button>
      <button class="cards-nav next" onclick="scrollCards(this,1)" aria-label="다음">›</button>
      <div class="cards-scroll">
        ${R.haejang.map(it => renderCard(it, 'R', 'haejang')).join('')}
      </div>
    </div>

    <a href="#compare" class="sel-cta" style="margin: 24px 16px 0;">
      <span>📊</span>
      <span>비교 페이지로 돌아가기 →</span>
    </a>

    <div class="app-footer">
      <a href="#a" class="card-action" style="display:inline-block; padding:12px 24px; margin-right:8px;">Trip A 다시 보기</a>
      <a href="#b" class="card-action primary" style="display:inline-block; padding:12px 24px;">Trip B 다시 보기</a>
      ${renderHomeButton()}
      <div class="footer-meta" style="margin-top:24px;">BIN MICHELIN ROAD · DAY 2</div>
    </div>
  `;
}

// ═══ 펜션 주변 편의시설 페이지 ═══
function renderFacilities() {
  const view = document.querySelector('.view-facilities');
  if (!view) return;
  const D = window.DATA;
  const list = D.NEARBY_FACILITIES || [];
  const M = D.FACILITY_META || {};
  const types = ['cvs','mart','gas','pharm','med','bank'];

  const groupHTML = types.map(t => {
    const items = list.filter(f => f.type === t);
    if (!items.length) return '';
    const meta = M[t] || { label:'', icon:'•', color:'#888' };
    return `
      <div class="section" style="padding-top:24px;">
        <div class="section-num" style="color:${meta.color};">${meta.icon}  ${meta.label.toUpperCase()}</div>
        <div class="section-title serif">${meta.label} (${items.length})</div>
      </div>
      <div class="facility-list">
        ${items.map(f => {
          const q = encodeURIComponent(f.name + ' ' + (f.addr||''));
          return `
            <a class="facility-row" href="https://map.kakao.com/?q=${q}" target="_blank" rel="noopener" style="border-left-color:${meta.color};">
              <div class="facility-ic" style="background:${meta.color};">${meta.icon}</div>
              <div class="facility-body">
                <div class="facility-top">
                  <span class="facility-name">${f.name}</span>
                  <span class="facility-type" style="color:${meta.color};">${f.km}km · ${f.min}분</span>
                </div>
                <div class="facility-sub">${f.sub}</div>
                ${f.note ? `<div class="facility-note">💡 ${f.note}</div>` : ''}
                <div class="facility-addr">${f.addr || ''}</div>
              </div>
              <div class="facility-arrow">→</div>
            </a>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  view.innerHTML = `
    <div class="app-header">
      <button class="back-btn" onclick="location.hash='menu'">←</button>
      <div class="header-title latin">FACILITIES</div>
      <div class="header-actions">
        <button class="icon-btn music-toggle" onclick="toggleMute()">🔊</button>
      </div>
    </div>

    <div class="plan-hero">
      <div class="plan-tag">PENSION AREA</div>
      <h1 class="plan-title serif">펜션 주변 편의시설</h1>
      <div class="plan-subtitle">${D.META.pension.name} 인근 · 거리·이동시간은 펜션 기준</div>
    </div>

    ${groupHTML}

    <div class="app-footer">
      ${renderHomeButton()}
      <div class="footer-meta" style="margin-top:24px;">BIN MICHELIN ROAD · NEARBY</div>
    </div>
  `;
}

// ═══ 수산시장 비교 ═══
function renderMarketCompare(planCode) {
  const M = window.DATA.MARKET_COMPARE;
  const isCurrentA = planCode === 'A';
  const cards = [
    { ...M.a, current: isCurrentA },
    { ...M.b, current: !isCurrentA },
  ];
  const labels = Object.keys(M.a.rows);

  return `
    <div class="market-wrap">
      <div class="market-grid">
        ${cards.map(c => `
          <div class="market-card ${c.current ? 'current' : ''}" style="border-color:${c.accent};">
            ${c.current ? '<div class="market-now">현재 안</div>' : ''}
            <div class="market-photo" style="background-image:url('${c.photo}'); background-color:${c.tone};"></div>
            <div class="market-body">
              <div class="market-sub" style="color:${c.accent};">${c.sub}</div>
              <a href="${c.naver}" target="_blank" rel="noopener" class="market-name">${c.name} ↗</a>
              <div class="market-addr">${c.addr}</div>
              <div class="market-card-actions">
                <a href="${c.url}" target="_blank" rel="noopener" class="mini-action">
                  <span class="mini-icon">📍</span> 카카오맵
                </a>
                <a href="${c.review}" target="_blank" rel="noopener" class="mini-action">
                  <span class="mini-icon">📝</span> 후기 보기
                </a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="market-table">
        ${labels.map(label => `
          <div class="market-row">
            <div class="market-label">${label}</div>
            <div class="market-cell" ${cards[0].current ? 'data-current="1"' : ''}>${cards[0].rows[label]}</div>
            <div class="market-cell" ${cards[1].current ? 'data-current="1"' : ''}>${cards[1].rows[label]}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ═══ 비교 페이지 ═══
function renderCompareGrand(a, b, r) {
  const aTotal = a.totalCost + r.totalCost;
  const bTotal = b.totalCost + r.totalCost;
  const cheaper = aTotal < bTotal ? 'A' : (bTotal < aTotal ? 'B' : '=');
  const fmt = n => (n/10000).toFixed(1) + '만';
  return `
    <div class="grand-grid">
      <div class="grand-col ${cheaper==='A'?'winner':''}">
        <div class="grand-tag" style="color:#C0392B;">Trip A</div>
        <div class="grand-num">${fmt(a.totalCost)}<span>원</span></div>
        <div class="grand-detail">1일차 (이동·점심·놀이)</div>
        <div class="grand-items">
          ${a.items.length ? a.items.map(it=>`<div>${it.tag} ${it.name}</div>`).join('') : '<div class="grand-empty">Trip A에서 선택하세요</div>'}
        </div>
      </div>
      <div class="grand-col ${cheaper==='B'?'winner':''}">
        <div class="grand-tag" style="color:#16A085;">Trip B</div>
        <div class="grand-num">${fmt(b.totalCost)}<span>원</span></div>
        <div class="grand-detail">1일차 (이동·점심·놀이)</div>
        <div class="grand-items">
          ${b.items.length ? b.items.map(it=>`<div>${it.tag} ${it.name}</div>`).join('') : '<div class="grand-empty">Trip B에서 선택하세요</div>'}
        </div>
      </div>
    </div>
    <a href="#return" class="grand-return grand-return-link">
      <div class="grand-return-label">
        ＋ 복귀 (5/5 공통)
        <span style="color:#666;">${r.items.length?`소계 ${fmt(r.totalCost)}원`:'탭하여 선택 →'}</span>
      </div>
      <div class="grand-return-items">
        ${r.items.length ? r.items.map(it=>`<div><span class="grand-pill">${it.tag}</span> ${it.name} <strong>${it.price}</strong></div>`).join('') : '<div class="grand-empty">카페 + 해장 선택 시 합산 · 탭해서 페이지로 이동</div>'}
        ${r.fuel > 0 ? `<div><span class="grand-pill">⛽</span> 복귀 detour 주유 (${r.extraKm.toFixed(0)}km) <strong>${fmt(r.fuel)}원</strong></div>` : ''}
      </div>
      <div class="grand-return-cta">${r.items.length ? '복귀 옵션 변경하기' : '복귀 옵션 선택하기'} →</div>
    </a>
    <div class="grand-totals">
      <div class="grand-total ${cheaper==='A'?'winner':''}">
        <div>Trip A 종합</div>
        <div class="grand-total-num">${fmt(aTotal)}<span>원</span></div>
      </div>
      <div class="grand-total ${cheaper==='B'?'winner':''}">
        <div>Trip B 종합</div>
        <div class="grand-total-num">${fmt(bTotal)}<span>원</span></div>
      </div>
    </div>
    ${a.items.length || b.items.length ? `
      <div class="grand-verdict">
        ${cheaper==='='?'A·B 동일':`${cheaper}안이 ${fmt(Math.abs(aTotal-bTotal))}원 더 저렴`}
      </div>
    ` : ''}
  `;
}

function renderReturnPicker() {
  const R = window.DATA.RETURN_DAY;
  return `
    <div class="section">
      <div class="section-num">★  RETURN PICK</div>
      <div class="section-title serif">복귀 옵션 선택</div>
      <div class="section-sub">카페 1개 + 해장 1개 → 종합 비용에 합산됨</div>
    </div>
    <div class="cards-wrap">
      <button class="cards-nav prev" onclick="scrollCards(this,-1)">‹</button>
      <button class="cards-nav next" onclick="scrollCards(this,1)">›</button>
      <div class="cards-scroll">
        ${R.cafes.map(it => renderCard(it, 'R', 'cafe')).join('')}
      </div>
    </div>
    <div class="cards-wrap" style="margin-top:8px;">
      <button class="cards-nav prev" onclick="scrollCards(this,-1)">‹</button>
      <button class="cards-nav next" onclick="scrollCards(this,1)">›</button>
      <div class="cards-scroll">
        ${R.haejang.map(it => renderCard(it, 'R', 'haejang')).join('')}
      </div>
    </div>
  `;
}

function renderCompare() {
  const view = document.querySelector('.view-compare');
  if (!view) return;
  const D = window.DATA;

  view.innerHTML = `
    <div class="app-header">
      <button class="back-btn" onclick="location.hash='menu'">←</button>
      <div class="header-title latin">COMPARE</div>
      <div class="header-actions">
        <button class="icon-btn music-toggle" onclick="toggleMute()">🔊</button>
      </div>
    </div>

    <div class="plan-hero">
      <div class="plan-tag">COMPARE</div>
      <h1 class="plan-title serif">Trip A vs Trip B</h1>
      <div class="plan-subtitle">선택 기반 종합 비교 (복귀 포함)</div>
    </div>

    <!-- 종합 비용 (선택 반영) -->
    <div class="section">
      <div class="section-num">00  GRAND TOTAL</div>
      <div class="section-title serif">선택 기반 종합 비용</div>
      <div class="section-sub">A·B 각 페이지에서 점심/놀거리 + 아래 복귀 옵션 선택 시 자동 합산</div>
    </div>
    <div class="grand-box" id="compare-grand"></div>

    <div class="compare-table" id="compare-table"></div>

    <div class="compare-verdict">
      <div class="verdict-label">FINAL VERDICT</div>
      <div class="verdict-winner serif">${D.COMPARE_VERDICT.winner === 'B' ? 'Trip B 추천' : 'Trip A 추천'}</div>
      <div class="verdict-reason">${D.COMPARE_VERDICT.reason}</div>
    </div>

    <div class="section" style="text-align:center; padding-top:40px;">
      <div style="display:flex; gap:12px; justify-content:center; max-width:400px; margin:0 auto;">
        <a href="#a" class="card-action" style="flex:1; padding:14px 0;">Trip A 보기</a>
        <a href="#b" class="card-action primary" style="flex:1; padding:14px 0;">Trip B 보기</a>
      </div>
    </div>

    <div class="app-footer">
      <button class="share-btn" onclick="shareToKakao('compare')">
        <span>💬</span> 비교 결과 카톡으로 공유
      </button>
      ${renderHomeButton()}
      <div class="footer-meta">BIN MICHELIN ROAD</div>
    </div>
  `;
}

// ═══ 실제 도로 경로 (OSRM 공개 API) ═══
async function fetchOSRMRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) return null;
  const coords = waypoints.map(w => `${w.lon},${w.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    if (j && j.routes && j.routes[0] && j.routes[0].geometry) {
      // GeoJSON [lon,lat] → Leaflet [lat,lon]
      return j.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    }
  } catch (e) { /* 네트워크 실패 시 직선 유지 */ }
  return null;
}

// ═══ 지도 (Leaflet — 도메인 인증 불필요) ═══
const VWORLD_KEY = 'FA24C8F5-407F-3393-9081-E69BAC0D6EB5';
let mapsInitialized = {};

function initPlanMaps(code) {
  if (!window.L) {
    initPlanMaps._retries = (initPlanMaps._retries || 0) + 1;
    if (initPlanMaps._retries > 10) return;
    setTimeout(() => initPlanMaps(code), 300);
    return;
  }
  if (mapsInitialized[code]) return;

  const container = document.getElementById(`map-overview-${code}`);
  if (!container) return;

  const plan = window.DATA.PLANS[code];
  const D = window.DATA;

  const start = plan.route[0];
  const end = plan.route[plan.route.length - 1];

  const map = L.map(container, {
    zoomControl: true,
    scrollWheelZoom: false,
    dragging: true,
    attributionControl: false,
  }).setView([(start.lat+end.lat)/2, (start.lon+end.lon)/2], 10);

  // VWorld 한글 타일 (키 있으면 사용, 안 되면 OSM 폴백)
  const vworld = L.tileLayer(
    `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Base/{z}/{y}/{x}.png`,
    { maxZoom: 18, attribution: '&copy; VWorld' }
  );
  const osm = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 19, attribution: '&copy; OSM' }
  );
  vworld.on('tileerror', () => {
    if (!map.hasLayer(osm)) { map.removeLayer(vworld); osm.addTo(map); }
  });
  vworld.addTo(map);

  // 폴리라인 — 일단 직선 그려두고, 실제 도로 경로 받아서 갱신
  let latlngs = plan.route.map(pt => [pt.lat, pt.lon]);
  const polyline = L.polyline(latlngs, {
    color: plan.accent, weight: 5, opacity: 0.9,
  }).addTo(map);
  // 실제 도로 경로 (OSRM) — 비동기 갱신
  fetchOSRMRoute(plan.route).then(roadLatlngs => {
    if (roadLatlngs && roadLatlngs.length > 1) {
      polyline.setLatLngs(roadLatlngs);
      try { map.fitBounds(roadLatlngs, { padding: [40,40] }); } catch(e) {}
    }
  });

  // 마커 (커스텀 디자인)
  plan.route.forEach(pt => {
    const color = pt.type === 'start' ? '#C0392B'
                : pt.type === 'end'   ? '#D4AF37'
                : pt.type === 'lunch' ? '#A04000'
                : '#7F8C8D';
    const html = `
      <div style="position:relative; transform:translate(-50%,-100%);">
        <div style="background:${color}; color:#fff; padding:6px 12px; border-radius:18px;
                    border:2px solid #fff; font-weight:700; font-size:12px;
                    box-shadow:0 3px 10px rgba(0,0,0,0.5); white-space:nowrap;
                    font-family:'Noto Sans KR',sans-serif;">${pt.name}</div>
        <div style="position:absolute; left:50%; bottom:-7px; transform:translateX(-50%);
                    width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent;
                    border-top:7px solid ${color};"></div>
      </div>`;
    const icon = L.divIcon({
      className: 'custom-pin', html, iconSize: [0,0], iconAnchor: [0,0],
    });
    const m = L.marker([pt.lat, pt.lon], { icon }).addTo(map);
    m.on('click', () => {
      window.open(`https://map.kakao.com/?q=${encodeURIComponent(pt.name)}`, '_blank');
    });
  });

  // 지도 범위 자동
  map.fitBounds(latlngs, { padding: [40,40] });

  // 오버레이 버튼 (카카오맵 길찾기 — 실제 경로로 열기)
  const overlay = document.createElement('button');
  overlay.className = 'map-overlay';
  overlay.textContent = '카카오맵 길찾기 →';
  overlay.style.zIndex = '999';
  overlay.onclick = (e) => {
    e.stopPropagation();
    const s = plan.route[0];
    const eEnd = plan.route[plan.route.length-1];
    // 카카오맵 길찾기 URL (출발↔도착 좌표 직접 지정)
    const url = `https://map.kakao.com/?sName=${encodeURIComponent(s.name)}` +
                `&eName=${encodeURIComponent(eEnd.name)}` +
                `&sX=${s.lon}&sY=${s.lat}&eX=${eEnd.lon}&eY=${eEnd.lat}`;
    window.open(url, '_blank');
  };
  container.appendChild(overlay);

  mapsInitialized[code] = true;
  setTimeout(() => map.invalidateSize(), 200);
}

// ═══ 카카오톡 공유 ═══
// 선택 결과를 텍스트로 (카톡 공유용)
function buildShareDescription(mode) {
  const D = window.DATA;
  const fmt = n => (n/10000).toFixed(1) + '만원';
  const findName = (list, tag) => { const it = list.find(x=>x.tag===tag); return it ? `${it.tag} ${it.name}` : '미선택'; };

  if (mode === 'A' || mode === 'B') {
    const r = calcSelection(mode);
    const sel = r.sel;
    const lines = [];
    lines.push(`[Trip ${mode}] ${D.PLANS[mode].subtitle}`);
    if (sel.lunch) lines.push(`🍽 ${findName(D.PLANS[mode].lunch, sel.lunch)}`);
    (sel.play||[]).forEach(t => lines.push(`🎯 ${findName(D.PLANS[mode].play, t)}`));
    if (r.items.length) {
      lines.push(`총 ${r.totalKm.toFixed(0)}km · ${r.totalMn}분 · ${fmt(r.totalCost)}`);
    } else {
      lines.push('아직 선택 안함 — 링크에서 직접 골라보세요');
    }
    return lines.join('\n');
  }
  if (mode === 'compare') {
    const a = calcSelection('A');
    const b = calcSelection('B');
    const ret = calcReturn();
    const aTotal = a.totalCost + ret.totalCost;
    const bTotal = b.totalCost + ret.totalCost;
    const lines = ['[Trip A·B 비교 결과]'];
    if (a.items.length || b.items.length || ret.items.length) {
      lines.push(`Trip A: ${fmt(aTotal)}  vs  Trip B: ${fmt(bTotal)}`);
      const cheap = aTotal < bTotal ? 'A' : (bTotal < aTotal ? 'B' : null);
      if (cheap) lines.push(`→ Trip ${cheap}안이 ${fmt(Math.abs(aTotal - bTotal))} 더 저렴`);
      if (a.sel.lunch) lines.push(`A 점심: ${findName(D.PLANS.A.lunch, a.sel.lunch)}`);
      if (b.sel.lunch) lines.push(`B 점심: ${findName(D.PLANS.B.lunch, b.sel.lunch)}`);
      if (ret.sel.cafe) lines.push(`복귀 카페: ${findName(D.RETURN_DAY.cafes, ret.sel.cafe)}`);
      if (ret.sel.haejang) lines.push(`복귀 해장: ${findName(D.RETURN_DAY.haejang, ret.sel.haejang)}`);
    } else {
      lines.push('각 페이지에서 점심·놀거리·복귀를 골라보세요');
    }
    return lines.join('\n');
  }
  return `${D.META.startDate} ~ ${D.META.endDate} · ${D.META.people}\n${calcDday()}`;
}

// 공유용 폴백 — 카카오 SDK 실패 또는 미지원 시
async function fallbackShare(title, text, url) {
  // 1) Web Share API (모바일에서 카톡 포함 모든 앱 선택)
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return true; } catch (e) {}
  }
  // 2) 클립보드 복사
  const fullText = `${title}\n\n${text}\n\n${url}`;
  try {
    await navigator.clipboard.writeText(fullText);
    alert('카톡 공유에 실패해서 클립보드에 복사했어요.\n붙여넣기로 공유해 주세요.');
    return true;
  } catch (e) {
    prompt('아래 내용을 복사해서 공유해 주세요:', fullText);
    return false;
  }
}

// 선택 → URL-safe base64 (JSON)
function encodeSelectionForURL() {
  try {
    const sel = getSelection();
    const json = JSON.stringify(sel);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  } catch (e) { return ''; }
}
// URL → 선택
function decodeSelectionFromURL(str) {
  try {
    const b64 = str.replace(/-/g,'+').replace(/_/g,'/');
    const pad = b64 + '==='.slice((b64.length + 3) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(pad))));
  } catch (e) { return null; }
}

function shareToKakao(mode) {
  const D = window.DATA;
  const baseUrl = window.location.href.split('#')[0].split('?')[0];
  const hash = mode === 'A' ? '#a' : mode === 'B' ? '#b' : mode === 'compare' ? '#compare' : '';
  const selStr = encodeSelectionForURL();
  const linkUrl = baseUrl + (selStr ? `?sel=${selStr}` : '') + hash;
  const url = baseUrl;
  const titleSuffix = mode === 'A' ? ' · Trip A 선택' : mode === 'B' ? ' · Trip B 선택' : mode === 'compare' ? ' · Trip A·B 비교' : '';
  const title = `${D.META.title} · ${D.META.subtitle}${titleSuffix}`;
  const description = buildShareDescription(mode);

  // 카카오 SDK 시도 (도메인 등록·로컬 환경 등 이슈 시 실패할 수 있음)
  initKakao();
  if (window.Kakao && window.Kakao.Share && window.Kakao.isInitialized()) {
    try {
      // 깨지지 않는 실제 OG 이미지 (꽃지해수욕장 — TourAPI)
      const ogImg = (D.PHOTOS && D.PHOTOS['꽃지해수욕장']) || 'https://tong.visitkorea.or.kr/cms/resource/23/3498123_image2_1.jpg';
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description,
          imageUrl: ogImg,
          link: { mobileWebUrl: linkUrl, webUrl: linkUrl },
        },
        buttons: [{ title: '여행 일정 보기', link: { mobileWebUrl: linkUrl, webUrl: linkUrl } }],
      });
      return;
    } catch (e) {
      console.warn('[shareToKakao] Kakao 공유 실패, 폴백:', e);
    }
  }
  // 폴백
  fallbackShare(title, description, linkUrl);
}

// ═══ 초기화 ═══
// URL에 ?sel=... 있으면 적용 (공유받은 선택)
function applySharedSelectionFromURL() {
  const params = new URLSearchParams(location.search);
  const sel = params.get('sel');
  if (!sel) return false;
  const decoded = decodeSelectionFromURL(sel);
  if (decoded && typeof decoded === 'object') {
    setSelection(decoded);
    // URL은 깔끔하게 ?sel= 빼주기
    const cleanUrl = location.pathname + location.hash;
    history.replaceState(null, '', cleanUrl);
    setTimeout(() => {
      const banner = document.createElement('div');
      banner.className = 'shared-banner';
      banner.innerHTML = '✨ 공유받은 선택이 적용됐어요';
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 3500);
    }, 800);
    return true;
  }
  return false;
}

window.addEventListener('DOMContentLoaded', () => {
  applySharedSelectionFromURL();
  setupBgm();
  setupIntro();
  renderMenu();
  renderPlan('A');
  renderPlan('B');
  renderCompare();
  renderReturn();
  renderFacilities();
  window.addEventListener('hashchange', router);
  router();
  startDdayCountdown();

  // 카카오 맵 SDK 동적 로드
  const script = document.createElement('script');
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
  script.onload = () => kakao.maps.load(() => {
    if (currentView === 'a' || currentView === 'b') {
      initPlanMaps(currentView.toUpperCase());
    }
  });
  document.head.appendChild(script);

  // 카카오 SDK
  const k = document.createElement('script');
  k.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
  k.onload = initKakao;
  document.head.appendChild(k);

  // 로더 숨김
  setTimeout(() => {
    const loader = document.querySelector('.loader');
    if (loader) loader.classList.add('hidden');
  }, 600);
});
