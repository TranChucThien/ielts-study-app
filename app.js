const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ===== DATA STORE =====
const DATA_KEYS = ['notes', 'flashcards', 'streak', 'checklist', 'history', 'settings', 'scores', 'sessions', 'vocabulary'];

const store = {
  get(k) {
    const fb = { settings: '{"targetBand":"6.5"}', streak: '{"count":0,"lastDate":""}' };
    return JSON.parse(localStorage.getItem('ielts-' + k) || fb[k] || '[]');
  },
  set(k, v) { localStorage.setItem('ielts-' + k, JSON.stringify(v)); },
  getAll() { const d = {}; DATA_KEYS.forEach(k => d[k] = this.get(k)); return d; },
  setAll(d) { DATA_KEYS.forEach(k => { if (d[k] !== undefined) this.set(k, d[k]); }); }
};

// ===== GITHUB SYNC =====
const github = {
  getConfig() { return JSON.parse(localStorage.getItem('ielts-github') || 'null'); },
  saveConfig(c) { localStorage.setItem('ielts-github', JSON.stringify(c)); },
  setStatus(t, type) {
    const el = $('#sync-status');
    if (el) { el.textContent = t; el.className = 'sync-status ' + (type || ''); }
  },
  async apiRequest(method, body) {
    const cfg = this.getConfig();
    if (!cfg?.token) throw new Error('Chưa cấu hình token');
    const url = `https://api.github.com/repos/${cfg.repo}/contents/${cfg.path}?ref=${cfg.branch}`;
    const headers = { 'Authorization': `token ${cfg.token}`, 'Accept': 'application/vnd.github.v3+json' };
    if (method === 'GET') {
      const r = await fetch(url, { headers });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`API: ${r.status}`);
      return r.json();
    }
    if (method === 'PUT') {
      const r = await fetch(url, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || `API: ${r.status}`); }
      return r.json();
    }
  },
  async pull() {
    this.setStatus('⟳ Đang tải...', 'syncing');
    try {
      const f = await this.apiRequest('GET');
      if (!f) { this.setStatus('Chưa có data', ''); return false; }
      store.setAll(JSON.parse(decodeURIComponent(escape(atob(f.content)))));
      localStorage.setItem('ielts-github-sha', f.sha);
      this.setStatus('● Synced ' + new Date().toLocaleTimeString('vi-VN'), 'connected');
      return true;
    } catch (e) { this.setStatus('✖ ' + e.message, 'error'); return false; }
  },
  async push() {
    this.setStatus('⟳ Đang lưu...', 'syncing');
    try {
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(store.getAll(), null, 2))));
      let sha = localStorage.getItem('ielts-github-sha');
      if (!sha) { const f = await this.apiRequest('GET'); sha = f?.sha; }
      const cfg = this.getConfig();
      const r = await this.apiRequest('PUT', { message: `sync: ${new Date().toISOString()}`, content, sha, branch: cfg.branch });
      localStorage.setItem('ielts-github-sha', r.content.sha);
      this.setStatus('● Saved ' + new Date().toLocaleTimeString('vi-VN'), 'connected');
      return true;
    } catch (e) { this.setStatus('✖ ' + e.message, 'error'); return false; }
  },
  async sync() {
    if (!this.getConfig()?.token) { this.setStatus('○ Chưa kết nối', ''); return; }
    await this.pull(); refreshAll();
  },
  async autoSave() { if (this.getConfig()?.token) await this.push(); }
};

let saveTimeout;
function scheduleSync() { clearTimeout(saveTimeout); saveTimeout = setTimeout(() => github.autoSave(), 3000); }

// ===== TOAST =====
let toastEl;
function toast(msg) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2000);
}

// ===== NAVIGATION =====
function navigateTo(page) {
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $$('.bnav').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $$('.page').forEach(p => p.classList.remove('active'));
  $(`#page-${page}`).classList.add('active');
}

$$('.nav-btn').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.page)));
$$('.bnav').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.page)));

// ===== HELPERS =====
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function today() { return new Date().toISOString().slice(0, 10); }
function fmtTime(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
function refreshAll() { refreshDashboard(); renderFcList(); renderNotes(); renderScores(); renderCalendar(); renderVocab(); }

// ===== QUOTES =====
const QUOTES = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"A different language is a different vision of life." — Federico Fellini',
  '"One language sets you in a corridor for life. Two languages open every door along the way." — Frank Smith',
  '"The limits of my language mean the limits of my world." — Ludwig Wittgenstein',
  '"Learning is not attained by chance, it must be sought for with ardor." — Abigail Adams',
  '"Success is the sum of small efforts, repeated day in and day out." — Robert Collier',
  '"Don\'t watch the clock; do what it does. Keep going." — Sam Levenson',
  '"You don\'t have to be great to start, but you have to start to be great." — Zig Ziglar',
  '"Consistency is what transforms average into excellence."',
  '"Every expert was once a beginner."'
];

function showQuote() {
  $('#quote-text').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// ===== WORD OF THE DAY =====
window.pickWotd = function() {
  const vocab = store.get('vocabulary');
  if (!vocab.length) {
    const cards = store.get('flashcards');
    if (!cards.length) { $('#wotd-card').style.display = 'none'; return; }
    const c = cards[Math.floor(Math.random() * cards.length)];
    $('#wotd-word').textContent = c.front;
    $('#wotd-phonetic').textContent = '';
    $('#wotd-meaning').textContent = c.back;
    $('#wotd-example').textContent = c.example || '';
    $('#wotd-card').style.display = 'block';
    return;
  }
  const v = vocab[Math.floor(Math.random() * vocab.length)];
  $('#wotd-word').textContent = v.word;
  $('#wotd-phonetic').textContent = v.phonetic || '';
  $('#wotd-meaning').textContent = v.meaning;
  $('#wotd-example').textContent = v.example || '';
  $('#wotd-card').style.display = 'block';
};

// ===== STREAK =====
function recordStudy() {
  const streak = store.get('streak');
  const d = today();
  if (streak.lastDate === d) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  streak.count = streak.lastDate === yesterday ? streak.count + 1 : 1;
  streak.lastDate = d;
  store.set('streak', streak);
  const hist = store.get('history');
  if (!hist.includes(d)) { hist.push(d); store.set('history', hist); }
  refreshDashboard();
  scheduleSync();
}

// ===== DASHBOARD =====
function refreshDashboard() {
  const streak = store.get('streak');
  const settings = store.get('settings');
  $('#streak-count').textContent = streak.count + ' ngày';
  $('#fc-count').textContent = store.get('flashcards').length;
  $('#vocab-count').textContent = store.get('vocabulary').length;
  updateStatProgress();
  $('#target-band-trigger').textContent = settings.targetBand;
  renderHeatmap();
  loadChecklist();
  showQuote();
  pickWotd();
  initQuickFc();
}

$('#target-band-trigger').addEventListener('click', e => {
  e.stopPropagation();
  $('#target-band-options').classList.toggle('open');
});

$$('#target-band-options .custom-select-option').forEach(opt => {
  opt.addEventListener('click', () => {
    const val = opt.dataset.value;
    $('#target-band-trigger').textContent = val;
    $$('#target-band-options .custom-select-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    $('#target-band-options').classList.remove('open');
    const s = store.get('settings'); s.targetBand = val; store.set('settings', s); scheduleSync();
  });
});

document.addEventListener('click', () => $('#target-band-options').classList.remove('open'));

function updateStatProgress() {
  const cards = store.get('flashcards');
  const reviewed = cards.filter(c => c.lastReview && new Date(c.lastReview).toISOString().slice(0,10) === today()).length;
  const fcPct = cards.length ? Math.min(100, (reviewed / cards.length) * 100) : 0;
  $('#fc-progress-bar').style.width = fcPct + '%';

  const vocab = store.get('vocabulary');
  const todayVocab = vocab.filter(v => v.created && new Date(v.created).toISOString().slice(0,10) === today()).length;
  const vocPct = vocab.length ? Math.min(100, (todayVocab / Math.max(vocab.length, 5)) * 100) : 0;
  $('#vocab-progress-bar').style.width = vocPct + '%';
}

function renderHeatmap() {
  const hist = new Set(store.get('history'));
  const el = $('#heatmap'); el.innerHTML = '';
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const cell = document.createElement('div');
    cell.className = 'hm-cell' + (hist.has(d) ? ' hm-3' : '');
    cell.title = d;
    el.appendChild(cell);
  }
}

function loadChecklist() {
  const cl = store.get('checklist');
  const d = today();
  const td = cl.find(c => c.date === d) || { date: d, items: {} };
  $$('#checklist input').forEach(cb => { cb.checked = !!td.items[cb.dataset.check]; });
}

$$('#checklist input').forEach(cb => {
  cb.addEventListener('change', () => {
    const cl = store.get('checklist'); const d = today();
    let td = cl.find(c => c.date === d);
    if (!td) { td = { date: d, items: {} }; cl.push(td); }
    td.items[cb.dataset.check] = cb.checked;
    store.set('checklist', cl);
    if (cb.checked) { recordStudy(); toast('Đã ghi nhận!'); }
    scheduleSync();
  });
});

$('#sync-btn').addEventListener('click', async () => {
  const btn = $('#sync-btn'); btn.disabled = true; btn.innerHTML = '<i class="icon-refresh-cw"></i>...';
  await github.push(); await github.pull(); refreshAll();
  btn.disabled = false; btn.innerHTML = '<i class="icon-refresh-cw"></i> Sync';
  toast('Đồng bộ xong!');
});

// ===== QUICK FLASHCARD (Dashboard) =====
let quickFcCards = [], quickFcIdx = 0, quickFcFlipped = false;

function initQuickFc() {
  quickFcCards = [...store.get('flashcards')].sort((a, b) => (a.score || 0) - (b.score || 0));
  quickFcIdx = 0;
  quickFcFlipped = false;
  if (!quickFcCards.length) { $('#quick-fc-card').style.display = 'none'; return; }
  $('#quick-fc-card').style.display = 'block';
  showQuickFc();
}

function showQuickFc() {
  if (quickFcIdx >= quickFcCards.length) quickFcIdx = 0;
  const c = quickFcCards[quickFcIdx];
  quickFcFlipped = false;
  $('#quick-fc-front').textContent = c.front;
  $('#quick-fc-back').style.display = 'none';
  $('#quick-fc-example').style.display = 'none';
  $('#quick-fc-hint').style.display = '';
  $('#quick-fc-progress').textContent = `${quickFcIdx + 1} / ${quickFcCards.length}`;
}

window.toggleQuickFc = () => {
  quickFcFlipped = !quickFcFlipped;
  const c = quickFcCards[quickFcIdx];
  $('#quick-fc-back').textContent = c.back;
  $('#quick-fc-example').textContent = c.example || '';
  $('#quick-fc-back').style.display = quickFcFlipped ? '' : 'none';
  $('#quick-fc-example').style.display = quickFcFlipped && c.example ? '' : 'none';
  $('#quick-fc-hint').style.display = quickFcFlipped ? 'none' : '';
};

$('#quick-fc-body').addEventListener('click', () => toggleQuickFc());


window.skipQuickFc = () => {
  quickFcIdx++;
  if (quickFcIdx >= quickFcCards.length) quickFcIdx = 0;
  showQuickFc();
};

// ===== FLASHCARDS =====
let fcEditId = null, fcStudyIdx = 0, fcStudyCards = [];

$('#fc-add-btn').addEventListener('click', () => {
  $('#fc-form').style.display = 'block'; fcEditId = null;
  $('#fc-front').value = ''; $('#fc-back').value = ''; $('#fc-example').value = '';
  $('#fc-front').focus();
});

$('#fc-cancel').addEventListener('click', () => { $('#fc-form').style.display = 'none'; });

$('#fc-save').addEventListener('click', () => {
  const front = $('#fc-front').value.trim(), back = $('#fc-back').value.trim();
  if (!front || !back) return;
  const cards = store.get('flashcards');
  if (fcEditId) {
    const c = cards.find(c => c.id === fcEditId);
    if (c) { c.front = front; c.back = back; c.example = $('#fc-example').value.trim(); c.deck = $('#fc-deck').value; }
    fcEditId = null;
  } else {
    cards.push({ id: crypto.randomUUID(), front, back, example: $('#fc-example').value.trim(), deck: $('#fc-deck').value, score: 0, lastReview: null });
  }
  store.set('flashcards', cards);
  $('#fc-form').style.display = 'none';
  renderFcList(); refreshDashboard(); recordStudy(); scheduleSync();
  toast('Đã lưu flashcard!');
});

$('#fc-filter-deck').addEventListener('change', () => renderFcList());

function renderFcList() {
  const deck = $('#fc-filter-deck').value;
  const cards = store.get('flashcards').filter(c => deck === 'all' || c.deck === deck);
  $('#fc-progress').textContent = `${cards.length} thẻ`;
  if (!cards.length) { $('#fc-list').innerHTML = '<div class="empty-state"><i class="icon-layers"></i>Chưa có flashcard nào<br><button class="btn-primary" onclick="$(\x27#fc-add-btn\x27).click()">+ Thêm flashcard</button></div>'; return; }
  const vocabMap = {};
  store.get('vocabulary').forEach(v => { vocabMap[v.word.toLowerCase()] = v.phonetic || ''; });
  $('#fc-list').innerHTML = cards.map(c => {
    const ph = vocabMap[c.front.toLowerCase()] || '';
    return `
    <div class="fc-item">
      <div class="fc-item-front">${esc(c.front)}${ph ? `<span class="fc-item-phonetic">${esc(ph)}</span>` : ''}</div>
      <span class="fc-item-back">${esc(c.back)}</span>
      <div class="fc-item-actions">
        <button onclick="editFc('${c.id}')"><i class="icon-pencil"></i></button>
        <button onclick="deleteFc('${c.id}')"><i class="icon-trash-2"></i></button>
      </div>
    </div>`;
  }).join('');
}

window.editFc = id => {
  const c = store.get('flashcards').find(c => c.id === id);
  if (!c) return;
  fcEditId = id;
  $('#fc-form').style.display = 'block';
  $('#fc-front').value = c.front; $('#fc-back').value = c.back;
  $('#fc-example').value = c.example || ''; $('#fc-deck').value = c.deck || 'general';
  $('#fc-front').focus();
};

window.deleteFc = id => {
  if (!confirm('Xoá thẻ này?')) return;
  store.set('flashcards', store.get('flashcards').filter(c => c.id !== id));
  renderFcList(); refreshDashboard(); scheduleSync();
};

// Study mode
$('#fc-study-btn').addEventListener('click', startStudy);

function startStudy() {
  const deck = $('#fc-filter-deck').value;
  fcStudyCards = [...store.get('flashcards')]
    .filter(c => deck === 'all' || c.deck === deck)
    .sort((a, b) => (a.score || 0) - (b.score || 0));
  if (!fcStudyCards.length) return toast('Thêm flashcard trước!');
  fcStudyIdx = 0;
  $('#fc-study').style.display = 'block';
  $('#fc-list').style.display = 'none';
  $('#fc-form').style.display = 'none';
  showStudyCard();
}

function exitStudy() {
  $('#fc-study').style.display = 'none';
  $('#fc-list').style.display = 'block';
  renderFcList();
}

$('#fc-exit-study').addEventListener('click', exitStudy);

$('#fc-prev-card').addEventListener('click', () => {
  if (fcStudyIdx > 0) { fcStudyIdx--; showStudyCard(); }
});

$('#fc-next-card').addEventListener('click', () => {
  fcStudyIdx++;
  showStudyCard();
});

function getPhonetic(word) {
  const v = store.get('vocabulary').find(v => v.word.toLowerCase() === word.toLowerCase());
  return v?.phonetic || '';
}

function showStudyCard() {
  if (fcStudyIdx >= fcStudyCards.length) {
    toast('Hoàn thành!');
    exitStudy();
    return;
  }
  const c = fcStudyCards[fcStudyIdx];
  $('#fc-card').classList.remove('flipped');
  $('#fc-front-text').textContent = c.front;
  $('#fc-phonetic-text').textContent = getPhonetic(c.front);
  $('#fc-back-text').textContent = c.back;
  $('#fc-example-text').textContent = c.example || '';
  $('#fc-study-progress').textContent = `${fcStudyIdx + 1} / ${fcStudyCards.length}`;
  $('#fc-prev-card').disabled = fcStudyIdx === 0;
}

// Flip: tap or click
$('#fc-card').addEventListener('click', () => $('#fc-card').classList.toggle('flipped'));

// Swipe support
let touchStartX = 0;
$('#fc-card').addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
$('#fc-card').addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 60) {
    fcStudyIdx++;
    showStudyCard();
  }
}, { passive: true });

window.rateCard = rating => {
  const cards = store.get('flashcards');
  const c = cards.find(c => c.id === fcStudyCards[fcStudyIdx].id);
  if (c) {
    c.score = (c.score || 0) + ({ hard: -1, ok: 0, easy: 2 }[rating]);
    c.lastReview = Date.now();
    store.set('flashcards', cards);
  }
  fcStudyIdx++;
  showStudyCard();
  recordStudy();
};

// ===== NOTES =====
let currentSkill = 'listening', noteEditId = null;

$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentSkill = tab.dataset.skill;
    noteEditId = null;
    $('#note-add').textContent = 'Thêm ghi chú';
    renderNotes();
  });
});

$('#note-add').addEventListener('click', () => {
  const title = $('#note-title').value.trim(), content = $('#note-content').value.trim();
  if (!title && !content) return;
  const notes = store.get('notes');
  if (noteEditId) {
    const n = notes.find(n => n.id === noteEditId);
    if (n) { n.title = title; n.content = content; n.tag = $('#note-tag').value; }
    noteEditId = null; $('#note-add').textContent = 'Thêm ghi chú';
  } else {
    notes.push({ id: crypto.randomUUID(), skill: currentSkill, title, content, tag: $('#note-tag').value, date: Date.now() });
  }
  store.set('notes', notes);
  $('#note-title').value = ''; $('#note-content').value = ''; $('#note-tag').value = '';
  renderNotes(); refreshDashboard(); recordStudy(); scheduleSync();
  toast('Đã lưu ghi chú!');
});

$('#note-search').addEventListener('input', () => renderNotes());

function renderNotes() {
  const filter = ($('#note-search').value || '').toLowerCase();
  const tags = { tip: 'Tip', mistake: 'Lỗi', template: 'Template', vocab: 'Vocab', grammar: 'Grammar' };
  const notes = store.get('notes')
    .filter(n => n.skill === currentSkill)
    .filter(n => !filter || (n.title + n.content).toLowerCase().includes(filter))
    .sort((a, b) => b.date - a.date);
  if (!notes.length) { $('#notes-list').innerHTML = '<div class="empty-state"><i class="icon-notebook-pen"></i>Chưa có ghi chú nào<br><button class="btn-primary" onclick="$(\x27#note-title\x27).focus()">+ Thêm ghi chú</button></div>'; return; }
  $('#notes-list').innerHTML = notes.map(n => `
    <div class="note-card">
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.content)}</p>
      <div class="note-meta">
        <div>${n.tag ? `<span class="note-tag tag-${n.tag}">${tags[n.tag] || n.tag}</span> ` : ''}${new Date(n.date).toLocaleDateString('vi-VN')}</div>
        <div class="note-actions">
          <button onclick="editNote('${n.id}')"><i class="icon-pencil"></i></button>
          <button onclick="deleteNote('${n.id}')"><i class="icon-trash-2"></i></button>
        </div>
      </div>
    </div>`).join('');
}

window.editNote = id => {
  const n = store.get('notes').find(n => n.id === id); if (!n) return;
  noteEditId = id;
  $('#note-title').value = n.title; $('#note-content').value = n.content; $('#note-tag').value = n.tag || '';
  $('#note-add').textContent = 'Cập nhật'; $('#note-title').focus();
};

window.deleteNote = id => {
  if (!confirm('Xoá ghi chú này?')) return;
  store.set('notes', store.get('notes').filter(n => n.id !== id));
  renderNotes(); refreshDashboard(); scheduleSync();
};

// ===== TIMER =====
let timerInterval = null, timerSeconds = 0, timerTotal = 0, timerPaused = false, timerLabel = '';

$$('.preset-btn:not(#custom-timer-btn)').forEach(btn => {
  btn.addEventListener('click', () => startTimer(+btn.dataset.time, btn.dataset.label));
});

$('#custom-timer-btn').addEventListener('click', () => {
  const m = +$('#custom-min').value;
  if (m > 0) startTimer(m * 60, `${m} phút`);
});

function startTimer(seconds, label) {
  clearInterval(timerInterval);
  timerSeconds = seconds; timerTotal = seconds; timerPaused = false; timerLabel = label;
  $('#timer-label').textContent = label;
  $('#timer-clock').textContent = fmtTime(timerSeconds);
  updateRing();
  $('.timer-presets').style.display = 'none';
  $('#timer-display').style.display = 'block';
  $('#timer-pause').innerHTML = '<i class="icon-pause"></i> Tạm dừng';
  recordStudy();

  timerInterval = setInterval(() => {
    if (timerPaused) return;
    timerSeconds--;
    $('#timer-clock').textContent = fmtTime(Math.max(0, timerSeconds));
    updateRing();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      saveTimerSession();
      $('#timer-clock').textContent = 'Hết giờ!';
      toast('Hết giờ!');
      try { navigator.vibrate?.(500); } catch(e) {}
    }
  }, 1000);
}

function updateRing() {
  const pct = timerTotal > 0 ? timerSeconds / timerTotal : 0;
  const offset = 565.48 * (1 - pct);
  const ring = $('#timer-ring-progress');
  if (ring) ring.style.strokeDashoffset = offset;
}

$('#timer-pause').addEventListener('click', () => {
  timerPaused = !timerPaused;
  $('#timer-pause').innerHTML = timerPaused ? '<i class="icon-play"></i> Tiếp tục' : '<i class="icon-pause"></i> Tạm dừng';
});

$('#timer-stop').addEventListener('click', () => {
  saveTimerSession();
  clearInterval(timerInterval);
  $('#timer-display').style.display = 'none';
  $('.timer-presets').style.display = 'block';
});

function saveTimerSession() {
  const elapsed = timerTotal - timerSeconds;
  if (elapsed < 5) return;
  const hist = JSON.parse(localStorage.getItem('ielts-timer-history') || '[]');
  hist.unshift({ label: timerLabel, duration: elapsed, total: timerTotal, date: Date.now() });
  if (hist.length > 30) hist.length = 30;
  localStorage.setItem('ielts-timer-history', JSON.stringify(hist));
  renderTimerHistory();
}

function renderTimerHistory() {
  const hist = JSON.parse(localStorage.getItem('ielts-timer-history') || '[]');
  if (!hist.length) { $('#timer-history').innerHTML = '<div class="empty-state"><i class="icon-timer"></i>Chưa có lịch sử</div>'; return; }
  $('#timer-history').innerHTML = hist.slice(0, 10).map(h => `
    <div class="timer-entry">
      <span class="timer-entry-label">${esc(h.label)}</span>
      <span>${fmtTime(h.duration)} / ${fmtTime(h.total)}</span>
      <span class="timer-entry-meta">${new Date(h.date).toLocaleDateString('vi-VN')}</span>
    </div>`).join('');
}

renderTimerHistory();

// ===== CALENDAR =====
let calYear, calMonth, calSelectedDate = null;

function initCalendar() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();
}

function renderCalendar() {
  const sessions = store.get('sessions');
  const todayStr = today();

  // Build skill map: date -> Set of skills
  const dateSkills = {};
  sessions.forEach(s => {
    if (!dateSkills[s.date]) dateSkills[s.date] = new Set();
    (s.skills || []).forEach(sk => dateSkills[s.date].add(sk));
  });

  const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  $('#cal-title').textContent = `${monthNames[calMonth]} ${calYear}`;

  const lastDay = new Date(calYear, calMonth + 1, 0);
  let startDow = new Date(calYear, calMonth, 1).getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const grid = $('#cal-grid');
  grid.innerHTML = '';

  const skillMap = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S', vocabulary: 'V' };

  for (let i = 0; i < startDow; i++) {
    grid.innerHTML += '<div class="cal-cell empty"></div>';
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === calSelectedDate;
    const skills = dateSkills[dateStr];
    const hasSession = !!skills;

    const cell = document.createElement('div');
    cell.className = 'cal-cell'
      + (isToday ? ' today' : '')
      + (isSelected ? ' selected' : '')
      + (hasSession ? ' has-session' : '');
    cell.dataset.date = dateStr;

    // Day number
    const num = document.createElement('span');
    num.className = 'cal-day-num';
    num.textContent = d;
    cell.appendChild(num);

    // Skill flags
    if (skills && skills.size > 0) {
      const flags = document.createElement('div');
      flags.className = 'cal-flags';
      ['listening', 'reading', 'writing', 'speaking', 'vocabulary'].forEach(sk => {
        if (skills.has(sk)) {
          const flag = document.createElement('span');
          flag.className = `cal-flag cal-flag-${skillMap[sk]}`;
          flag.textContent = skillMap[sk];
          flags.appendChild(flag);
        }
      });
      cell.appendChild(flags);
    }

    cell.addEventListener('click', () => selectCalDay(dateStr));
    grid.appendChild(cell);
  }
}

function selectCalDay(dateStr) {
  calSelectedDate = dateStr;
  renderCalendar();

  // Show day panel
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
  $('#cal-day-title').textContent = `${dayNames[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`;
  $('#cal-day-panel').style.display = 'block';

  // Reset form
  $('#ses-title').value = '';
  $('#ses-content').value = '';
  $('#ses-mood').value = '';
  $$('.ses-skill-tag input').forEach(cb => cb.checked = false);
  sesEditId = null;
  $('#ses-add').textContent = 'Lưu buổi học';

  renderSessions(dateStr);
}

let sesEditId = null;

function renderSessions(dateStr) {
  const sessions = store.get('sessions')
    .filter(s => s.date === dateStr)
    .sort((a, b) => b.created - a.created);

  const skillLabels = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S', vocabulary: 'V' };
  const moodLabels = { great: 'Rất tốt', good: 'Tốt', ok: 'Bình thường', bad: 'Chưa tốt' };

  if (!sessions.length) {
    $('#ses-list').innerHTML = '<div class="empty-state"><i class="icon-calendar-days"></i>Chưa có ghi chú buổi học</div>';
    return;
  }

  $('#ses-list').innerHTML = sessions.map(s => `
    <div class="ses-entry">
      <h4>${esc(s.title)}</h4>
      <p>${esc(s.content)}</p>
      <div class="ses-entry-meta">
        <div class="ses-tags">
          ${(s.skills || []).map(sk => `<span class="ses-tag-pill ses-tag-${sk}">${skillLabels[sk] || sk}</span>`).join('')}
          ${s.mood ? `<span class="ses-mood">${moodLabels[s.mood] || s.mood}</span>` : ''}
        </div>
        <div class="ses-entry-actions">
          <button onclick="editSession('${s.id}')"><i class="icon-pencil"></i></button>
          <button onclick="deleteSession('${s.id}')"><i class="icon-trash-2"></i></button>
        </div>
      </div>
    </div>`).join('');
}

$('#cal-prev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});

$('#cal-next').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

$('#cal-today').addEventListener('click', () => {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  selectCalDay(today());
});

$('#cal-day-close').addEventListener('click', () => {
  $('#cal-day-panel').style.display = 'none';
  calSelectedDate = null;
  renderCalendar();
});

$('#ses-add').addEventListener('click', () => {
  const title = $('#ses-title').value.trim();
  const content = $('#ses-content').value.trim();
  if (!title && !content) return;

  const skills = [...$$('.ses-skill-tag input:checked')].map(cb => cb.value);
  const mood = $('#ses-mood').value;
  const sessions = store.get('sessions');

  if (sesEditId) {
    const s = sessions.find(s => s.id === sesEditId);
    if (s) { s.title = title; s.content = content; s.skills = skills; s.mood = mood; }
    sesEditId = null;
    $('#ses-add').textContent = 'Lưu buổi học';
  } else {
    sessions.push({
      id: crypto.randomUUID(),
      date: calSelectedDate,
      title, content, skills, mood,
      created: Date.now()
    });
  }

  store.set('sessions', sessions);
  $('#ses-title').value = ''; $('#ses-content').value = ''; $('#ses-mood').value = '';
  $$('.ses-skill-tag input').forEach(cb => cb.checked = false);

  renderSessions(calSelectedDate);
  renderCalendar();
  recordStudy();
  scheduleSync();
  toast('Đã lưu buổi học!');
});

window.editSession = id => {
  const s = store.get('sessions').find(s => s.id === id);
  if (!s) return;
  sesEditId = id;
  $('#ses-title').value = s.title;
  $('#ses-content').value = s.content;
  $('#ses-mood').value = s.mood || '';
  $$('.ses-skill-tag input').forEach(cb => cb.checked = (s.skills || []).includes(cb.value));
  $('#ses-add').textContent = 'Cập nhật';
  $('#ses-title').focus();
};

window.deleteSession = id => {
  if (!confirm('Xoá buổi học này?')) return;
  store.set('sessions', store.get('sessions').filter(s => s.id !== id));
  renderSessions(calSelectedDate);
  renderCalendar();
  scheduleSync();
};

// Swipe month on mobile
let calTouchX = 0;
$('#cal-grid')?.addEventListener('touchstart', e => { calTouchX = e.touches[0].clientX; }, { passive: true });
$('#cal-grid')?.addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientX - calTouchX;
  if (Math.abs(diff) > 80) {
    if (diff > 0) { $('#cal-prev').click(); }
    else { $('#cal-next').click(); }
  }
}, { passive: true });

// ===== VOCABULARY =====
let vocEditId = null;

document.getElementById('voc-add-btn').addEventListener('click', function() {
  document.getElementById('voc-form').style.display = 'block';
  vocEditId = null;
  document.getElementById('voc-word').value = '';
  document.getElementById('voc-meaning').value = '';
  document.getElementById('voc-phonetic').value = '';
  document.getElementById('voc-example').value = '';
  document.getElementById('voc-synonym').value = '';
  document.getElementById('voc-type').value = '';
  document.getElementById('voc-topic').value = 'other';
  document.getElementById('voc-word').focus();
});

document.getElementById('voc-cancel').addEventListener('click', function() {
  document.getElementById('voc-form').style.display = 'none';
});

document.getElementById('voc-save').addEventListener('click', function() {
  var wordEl = document.getElementById('voc-word');
  var meaningEl = document.getElementById('voc-meaning');
  var word = wordEl.value.trim();
  var meaning = meaningEl.value.trim();
  if (!word || !meaning) { toast('Cần nhập từ và nghĩa!'); return; }

  var vocab = store.get('vocabulary');
  var entry = {
    word: word,
    meaning: meaning,
    type: document.getElementById('voc-type').value,
    phonetic: document.getElementById('voc-phonetic').value.trim(),
    example: document.getElementById('voc-example').value.trim(),
    synonyms: document.getElementById('voc-synonym').value.trim().split(',').map(function(s) { return s.trim(); }).filter(Boolean),
    topic: document.getElementById('voc-topic').value
  };

  if (vocEditId) {
    var v = vocab.find(function(v) { return v.id === vocEditId; });
    if (v) Object.assign(v, entry);
    vocEditId = null;
  } else {
    entry.id = crypto.randomUUID();
    entry.created = Date.now();
    vocab.push(entry);
    var cards = store.get('flashcards');
    cards.push({ id: crypto.randomUUID(), front: word, back: meaning, example: entry.example, deck: 'general', score: 0, lastReview: null });
    store.set('flashcards', cards);
  }

  store.set('vocabulary', vocab);
  document.getElementById('voc-form').style.display = 'none';
  renderVocab(); renderFcList(); refreshDashboard(); recordStudy(); scheduleSync();
  toast('Đã lưu từ vựng!');
});

$('#voc-filter-topic').addEventListener('change', () => renderVocab());
$('#voc-search').addEventListener('input', () => renderVocab());

function renderVocab() {
  const topic = $('#voc-filter-topic').value;
  const filter = ($('#voc-search').value || '').toLowerCase();
  const topicLabels = { environment: 'Environment', education: 'Education', technology: 'Technology', health: 'Health', society: 'Society', work: 'Work', other: 'Other' };
  const vocab = store.get('vocabulary')
    .filter(v => topic === 'all' || v.topic === topic)
    .filter(v => !filter || (v.word + v.meaning).toLowerCase().includes(filter))
    .sort((a, b) => (b.created || 0) - (a.created || 0));

  $('#voc-count').textContent = `${vocab.length} từ`;
  if (!vocab.length) { $('#voc-list').innerHTML = '<div class="empty-state"><i class="icon-book-open"></i>Chưa có từ vựng nào<br><button class="btn-primary" onclick="$(\x27#voc-add-btn\x27).click()">+ Thêm từ</button></div>'; return; }

  $('#voc-list').innerHTML = vocab.map(v => `
    <div class="voc-card">
      <div class="voc-header">
        <div>
          <div class="voc-word-line">
            <span class="voc-word">${esc(v.word)}</span>
            ${v.type ? `<span class="voc-type">${v.type}</span>` : ''}
          </div>
          ${v.phonetic ? `<div class="voc-phonetic">${esc(v.phonetic)}</div>` : ''}
        </div>
      </div>
      <div class="voc-meaning">${esc(v.meaning)}</div>
      ${v.example ? `<div class="voc-example">“${esc(v.example)}”</div>` : ''}
      ${v.synonyms?.length ? `<div class="voc-synonyms">${v.synonyms.map(s => `<span class="voc-syn">≈ ${esc(s)}</span>`).join('')}</div>` : ''}
      <div class="voc-meta">
        <span class="voc-topic-tag">${topicLabels[v.topic] || v.topic}</span>
        <div class="voc-actions">
          <button onclick="editVoc('${v.id}')"><i class="icon-pencil"></i></button>
          <button onclick="deleteVoc('${v.id}')"><i class="icon-trash-2"></i></button>
        </div>
      </div>
    </div>`).join('');
}

window.editVoc = id => {
  const v = store.get('vocabulary').find(v => v.id === id); if (!v) return;
  vocEditId = id;
  $('#voc-form').style.display = 'block';
  $('#voc-word').value = v.word; $('#voc-meaning').value = v.meaning;
  $('#voc-type').value = v.type || ''; $('#voc-phonetic').value = v.phonetic || '';
  $('#voc-example').value = v.example || ''; $('#voc-synonym').value = (v.synonyms || []).join(', ');
  $('#voc-topic').value = v.topic || 'other';
  $('#voc-word').focus();
};

window.deleteVoc = id => {
  if (!confirm('Xoá từ này?')) return;
  const vocab = store.get('vocabulary');
  const v = vocab.find(v => v.id === id);
  if (v) {
    const cards = store.get('flashcards').filter(c => c.front !== v.word);
    store.set('flashcards', cards);
  }
  store.set('vocabulary', vocab.filter(v => v.id !== id));
  renderVocab(); renderFcList(); refreshDashboard(); scheduleSync();
};

// Sample data
const SAMPLE_VOCAB = [
  { word: 'deteriorate', type: 'v', meaning: 'xuống cấp, xấu đi', phonetic: '/dɪˈtɪəriəreɪt/', example: 'Air quality has deteriorated significantly.', synonyms: ['decline', 'worsen'], topic: 'environment' },
  { word: 'sustainable', type: 'adj', meaning: 'bền vững', phonetic: '/səˈsteɪnəbl/', example: 'We need sustainable energy sources.', synonyms: ['viable', 'long-term'], topic: 'environment' },
  { word: 'curriculum', type: 'n', meaning: 'chương trình giảng dạy', phonetic: '/kəˈrɪkjʊləm/', example: 'The school updated its curriculum.', synonyms: ['syllabus', 'program'], topic: 'education' },
  { word: 'innovative', type: 'adj', meaning: 'sáng tạo, đổi mới', phonetic: '/ˈɪnəveɪtɪv/', example: 'Innovative teaching methods improve learning.', synonyms: ['creative', 'groundbreaking'], topic: 'education' },
  { word: 'ubiquitous', type: 'adj', meaning: 'có mặt khắp nơi', phonetic: '/juːˈbɪkwɪtəs/', example: 'Smartphones have become ubiquitous.', synonyms: ['omnipresent', 'widespread'], topic: 'technology' },
  { word: 'exacerbate', type: 'v', meaning: 'làm trầm trọng thêm', phonetic: '/ɪɡˈzæsərbeɪt/', example: 'Pollution exacerbates health problems.', synonyms: ['aggravate', 'worsen'], topic: 'health' },
  { word: 'phenomenon', type: 'n', meaning: 'hiện tượng', phonetic: '/fəˈnɒmɪnən/', example: 'Global warming is a well-documented phenomenon.', synonyms: ['occurrence', 'event'], topic: 'environment' },
  { word: 'predominantly', type: 'adv', meaning: 'chủ yếu, phần lớn', phonetic: '/prɪˈdɒmɪnəntli/', example: 'The workforce is predominantly young.', synonyms: ['mainly', 'mostly'], topic: 'society' },
  { word: 'fluctuate', type: 'v', meaning: 'dao động, biến đổi', phonetic: '/ˈflʌktʃueɪt/', example: 'Prices fluctuate throughout the year.', synonyms: ['vary', 'oscillate'], topic: 'work' },
  { word: 'infrastructure', type: 'n', meaning: 'cơ sở hạ tầng', phonetic: '/ˈɪnfrəstrʌktʃər/', example: 'The government invested in infrastructure.', synonyms: ['framework', 'foundation'], topic: 'society' },
  { word: 'autonomous', type: 'adj', meaning: 'tự chủ, tự trị', phonetic: '/ɔːˈtɒnəməs/', example: 'Autonomous vehicles are being tested.', synonyms: ['independent', 'self-governing'], topic: 'technology' },
  { word: 'alleviate', type: 'v', meaning: 'giảm bớt, xoa dịu', phonetic: '/əˈliːvieɪt/', example: 'Medicine can alleviate pain.', synonyms: ['relieve', 'ease'], topic: 'health' },
  { word: 'compelling', type: 'adj', meaning: 'thuyết phục, hấp dẫn', phonetic: '/kəmˈpelɪŋ/', example: 'She made a compelling argument.', synonyms: ['convincing', 'persuasive'], topic: 'other' },
  { word: 'disparity', type: 'n', meaning: 'sự chênh lệch', phonetic: '/dɪˈspærəti/', example: 'Income disparity is a growing concern.', synonyms: ['inequality', 'gap'], topic: 'society' },
  { word: 'proficiency', type: 'n', meaning: 'sự thành thạo', phonetic: '/prəˈfɪʃənsi/', example: 'Language proficiency is essential.', synonyms: ['competence', 'expertise'], topic: 'education' },
  { word: 'mitigate', type: 'v', meaning: 'giảm thiểu', phonetic: '/ˈmɪtɪɡeɪt/', example: 'Trees help mitigate climate change.', synonyms: ['reduce', 'lessen'], topic: 'environment' },
  { word: 'unprecedented', type: 'adj', meaning: 'chưa từng có tiền lệ', phonetic: '/ʌnˈpresɪdentɪd/', example: 'The pandemic caused unprecedented disruption.', synonyms: ['unparalleled', 'unheard-of'], topic: 'society' },
  { word: 'sedentary', type: 'adj', meaning: 'ít vận động', phonetic: '/ˈsedəntri/', example: 'A sedentary lifestyle leads to health issues.', synonyms: ['inactive', 'stationary'], topic: 'health' },
  { word: 'versatile', type: 'adj', meaning: 'đa năng, linh hoạt', phonetic: '/ˈvɜːsətaɪl/', example: 'She is a versatile employee.', synonyms: ['adaptable', 'flexible'], topic: 'work' },
  { word: 'proliferation', type: 'n', meaning: 'sự gia tăng nhanh', phonetic: '/prəˌlɪfəˈreɪʃən/', example: 'The proliferation of social media changed communication.', synonyms: ['spread', 'expansion'], topic: 'technology' },
  { word: 'detrimental', type: 'adj', meaning: 'có hại', phonetic: '/ˌdetrɪˈmentl/', example: 'Smoking is detrimental to health.', synonyms: ['harmful', 'damaging'], topic: 'health' },
  { word: 'incentive', type: 'n', meaning: 'động lực, ưu đãi', phonetic: '/ɪnˈsentɪv/', example: 'Tax incentives encourage investment.', synonyms: ['motivation', 'stimulus'], topic: 'work' },
  { word: 'eradicate', type: 'v', meaning: 'xóa bỏ, loại trừ', phonetic: '/ɪˈrædɪkeɪt/', example: 'Efforts to eradicate poverty continue.', synonyms: ['eliminate', 'abolish'], topic: 'society' },
  { word: 'cognitive', type: 'adj', meaning: 'thuộc nhận thức', phonetic: '/ˈkɒɡnətɪv/', example: 'Reading improves cognitive abilities.', synonyms: ['mental', 'intellectual'], topic: 'education' },
  { word: 'biodiversity', type: 'n', meaning: 'đa dạng sinh học', phonetic: '/ˌbaɪəʊdaɪˈvɜːsəti/', example: 'Deforestation threatens biodiversity.', synonyms: ['ecological variety'], topic: 'environment' }
];

$('#voc-sample-btn').addEventListener('click', () => {
  const vocab = store.get('vocabulary');
  const cards = store.get('flashcards');
  const existingWords = new Set(vocab.map(v => v.word.toLowerCase()));
  let added = 0;
  SAMPLE_VOCAB.forEach(s => {
    if (existingWords.has(s.word.toLowerCase())) return;
    const id = crypto.randomUUID();
    vocab.push({ ...s, id, created: Date.now() });
    cards.push({ id: crypto.randomUUID(), front: s.word, back: s.meaning, example: s.example, deck: 'general', score: 0, lastReview: null });
    added++;
  });
  store.set('vocabulary', vocab);
  store.set('flashcards', cards);
  renderVocab(); renderFcList(); refreshDashboard(); scheduleSync();
  toast(`Đã thêm ${added} từ mẫu!`);
});

// ===== SCORES =====
$('#score-date').value = today();

$('#score-add').addEventListener('click', () => {
  const l = +$('#score-l').value, r = +$('#score-r').value, w = +$('#score-w').value, s = +$('#score-s').value;
  if (!l && !r && !w && !s) return toast('Nhập ít nhất 1 điểm!');
  const scores = store.get('scores');
  const overall = Math.round(((l + r + w + s) / 4) * 2) / 2;
  scores.push({ id: crypto.randomUUID(), date: $('#score-date').value, l, r, w, s, overall, created: Date.now() });
  store.set('scores', scores);
  $('#score-l').value = ''; $('#score-r').value = ''; $('#score-w').value = ''; $('#score-s').value = '';
  renderScores(); recordStudy(); scheduleSync();
  toast('Đã lưu điểm!');
});

function renderScores() {
  const scores = store.get('scores').sort((a, b) => b.created - a.created);
  if (!scores.length) { $('#score-chart').style.display = 'none'; $('#score-history').innerHTML = '<div class="empty-state"><i class="icon-trending-up"></i>Chưa có điểm nào</div>'; return; }
  renderScoreChart(scores);
  $('#score-history').innerHTML = scores.map(s => `
    <div class="score-entry">
      <div class="score-entry-header">
        <span class="score-entry-date">${new Date(s.date).toLocaleDateString('vi-VN')}</span>
        <span class="score-entry-overall">Overall: ${s.overall}</span>
      </div>
      <div class="score-entry-skills">
        <div><div class="score-skill-label">L</div><div class="score-skill-value">${s.l}</div></div>
        <div><div class="score-skill-label">R</div><div class="score-skill-value">${s.r}</div></div>
        <div><div class="score-skill-label">W</div><div class="score-skill-value">${s.w}</div></div>
        <div><div class="score-skill-label">S</div><div class="score-skill-value">${s.s}</div></div>
      </div>
      <div class="score-entry-actions"><button onclick="deleteScore('${s.id}')"><i class="icon-trash-2"></i></button></div>
    </div>`).join('');
}

window.deleteScore = id => {
  if (!confirm('Xoá?')) return;
  store.set('scores', store.get('scores').filter(s => s.id !== id));
  renderScores(); scheduleSync();
};

function renderScoreChart(scores) {
  const sorted = [...scores].sort((a, b) => a.created - b.created).slice(-10);
  if (sorted.length < 2) { $('#score-chart').style.display = 'none'; return; }
  $('#score-chart').style.display = 'block';
  const max = 9;
  $('#score-chart-body').innerHTML = sorted.map(s => {
    const h = v => Math.max(2, (v / max) * 100);
    return `<div class="score-bar-group">
      <div class="score-bar-cols">
        <div class="score-bar bar-l" style="height:${h(s.l)}%" title="L: ${s.l}"></div>
        <div class="score-bar bar-r" style="height:${h(s.r)}%" title="R: ${s.r}"></div>
        <div class="score-bar bar-w" style="height:${h(s.w)}%" title="W: ${s.w}"></div>
        <div class="score-bar bar-s" style="height:${h(s.s)}%" title="S: ${s.s}"></div>
      </div>
      <span class="score-bar-overall">${s.overall}</span>
      <span class="score-bar-date">${new Date(s.date).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit'})}</span>
    </div>`;
  }).join('') + '<div class="score-chart-legend"><span class="leg-l">L</span><span class="leg-r">R</span><span class="leg-w">W</span><span class="leg-s">S</span></div>';
}

// ===== SETTINGS =====
function loadGithubConfig() {
  const cfg = github.getConfig();
  if (cfg) {
    $('#gh-token').value = cfg.token || '';
    $('#gh-repo').value = cfg.repo || '';
    $('#gh-branch').value = cfg.branch || 'main';
    $('#gh-path').value = cfg.path || 'data.json';
  }
}

$('#gh-save').addEventListener('click', () => {
  const cfg = { token: $('#gh-token').value.trim(), repo: $('#gh-repo').value.trim(), branch: $('#gh-branch').value.trim() || 'main', path: $('#gh-path').value.trim() || 'data.json' };
  if (!cfg.token || !cfg.repo) return showGhStatus('Cần Token và Repo!', 'error');
  github.saveConfig(cfg);
  showGhStatus('● Đã lưu!', 'success');
  github.setStatus('● Đã kết nối', 'connected');
  toast('Đã lưu cấu hình GitHub!');
});

$('#gh-test').addEventListener('click', async () => {
  const cfg = { token: $('#gh-token').value.trim(), repo: $('#gh-repo').value.trim(), branch: $('#gh-branch').value.trim() || 'main', path: $('#gh-path').value.trim() || 'data.json' };
  if (!cfg.token || !cfg.repo) return showGhStatus('Cần Token và Repo!', 'error');
  github.saveConfig(cfg);
  showGhStatus('⟳ Testing...', 'success');
  try {
    const r = await fetch(`https://api.github.com/repos/${cfg.repo}`, { headers: { 'Authorization': `token ${cfg.token}` } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const repo = await r.json();
    showGhStatus(`● OK! Repo: ${repo.full_name}`, 'success');
    github.setStatus('● Đã kết nối', 'connected');
  } catch (e) { showGhStatus('✖ ' + e.message, 'error'); }
});

function showGhStatus(msg, type) {
  const el = $('#gh-status'); el.textContent = msg; el.className = type; el.style.display = 'block';
}

// Data
$('#export-btn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(store.getAll(), null, 2)], { type: 'application/json' }));
  a.download = `ielts-backup-${today()}.json`; a.click();
  toast('Đã export!');
});

$('#import-trigger').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', () => {
  const file = $('#import-file').files[0];
  if (!file) return;
  if (!confirm('Ghi đè dữ liệu hiện tại?')) return;
  const reader = new FileReader();
  reader.onload = e => {
    try { store.setAll(JSON.parse(e.target.result)); refreshAll(); scheduleSync(); toast('Import OK!'); }
    catch { toast('File không hợp lệ!'); }
  };
  reader.readAsText(file);
});

$('#reset-btn').addEventListener('click', () => {
  if (!confirm('XOÁ HẾT dữ liệu?')) return;
  DATA_KEYS.forEach(k => localStorage.removeItem('ielts-' + k));
  refreshAll(); scheduleSync(); toast('Đã xoá!');
});

// ===== DICTATION =====
let dictMode = 'word', dictRate = 1, dictCount = 10, dictTopic = 'all';
let dictItems = [], dictIdx = 0, dictCorrect = 0, dictWrong = 0, dictResults = [], dictAnswered = false;

$$('.dict-mode-btn').forEach(b => b.addEventListener('click', () => {
  $$('.dict-mode-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  dictMode = b.dataset.mode;
}));

$$('.dict-speed-btn').forEach(b => b.addEventListener('click', () => {
  $$('.dict-speed-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  dictRate = +b.dataset.rate;
}));

$$('.dict-count-btn').forEach(b => b.addEventListener('click', () => {
  $$('.dict-count-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  dictCount = +b.dataset.count;
}));

$$('.dict-topic-btn').forEach(b => b.addEventListener('click', () => {
  $$('.dict-topic-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  dictTopic = b.dataset.topic;
}));

function getDictItems() {
  let vocab = store.get('vocabulary');
  const cards = store.get('flashcards');
  if (dictTopic !== 'all') vocab = vocab.filter(v => v.topic === dictTopic);
  let pool = [];
  if (dictMode === 'word') {
    pool = vocab.map(v => v.word);
    if (!pool.length) pool = cards.map(c => c.front);
  } else {
    pool = vocab.filter(v => v.example).map(v => v.example);
    if (!pool.length) pool = cards.filter(c => c.example).map(c => c.example);
  }
  pool = [...new Set(pool)].filter(Boolean);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return dictCount > 0 ? pool.slice(0, dictCount) : pool;
}

function dictSpeak(text) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = dictRate; u.volume = 1; u.pitch = 1;
  const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  const preferred = voices.find(v => /google|samantha|daniel|karen/i.test(v.name)) || voices[0];
  if (preferred) u.voice = preferred;
  $('#dict-play-btn').classList.add('playing');
  u.onend = () => $('#dict-play-btn').classList.remove('playing');
  speechSynthesis.speak(u);
}

$('#dict-start').addEventListener('click', () => {
  dictItems = getDictItems();
  if (!dictItems.length) return toast(dictMode === 'word' ? 'Thêm từ vựng trước!' : 'Cần từ vựng có ví dụ!');
  dictIdx = 0; dictCorrect = 0; dictWrong = 0; dictResults = [];
  $('#dict-setup').style.display = 'none';
  $('#dict-play').style.display = 'block';
  $('#dict-result').style.display = 'none';
  showDictItem();
});

function showDictItem() {
  dictAnswered = false;
  const total = dictItems.length;
  $('#dict-current').textContent = `${dictIdx + 1}/${total}`;
  $('#dict-score-live').innerHTML = `<span style="color:var(--green)">✓ ${dictCorrect}</span> &nbsp; <span style="color:var(--red)">✗ ${dictWrong}</span>`;
  $('#dict-progress-fill').style.width = ((dictIdx / total) * 100) + '%';
  $('#dict-input').value = '';
  $('#dict-feedback').innerHTML = '';
  $('#dict-check').style.display = '';
  $('#dict-skip').style.display = '';
  $('#dict-next').style.display = 'none';
  $('#dict-input').focus();
}

$('#dict-play-btn').addEventListener('click', () => {
  if (dictIdx < dictItems.length) dictSpeak(dictItems[dictIdx]);
});

function checkDictAnswer() {
  if (dictAnswered) return;
  dictAnswered = true;
  const answer = dictItems[dictIdx];
  const typed = $('#dict-input').value.trim();
  const isCorrect = typed.toLowerCase() === answer.toLowerCase();

  if (isCorrect) {
    dictCorrect++;
    $('#dict-feedback').innerHTML = `<span class="correct">✓ Chính xác!</span>`;
  } else {
    dictWrong++;
    let diffHtml = '';
    const aLow = answer.toLowerCase(), tLow = (typed || '').toLowerCase();
    for (let i = 0; i < answer.length; i++) {
      const cls = (i < tLow.length && tLow[i] === aLow[i]) ? 'diff-char-ok' : 'diff-char-err';
      diffHtml += `<span class="${cls}">${answer[i]}</span>`;
    }
    $('#dict-feedback').innerHTML = typed
      ? `<span class="wrong">${esc(typed)}</span><br><span class="answer">${diffHtml}</span>`
      : `<span class="answer">${esc(answer)}</span>`;
  }

  dictResults.push({ answer, typed, ok: isCorrect });
  $('#dict-score-live').innerHTML = `<span style="color:var(--green)">✓ ${dictCorrect}</span> &nbsp; <span style="color:var(--red)">✗ ${dictWrong}</span>`;
  $('#dict-check').style.display = 'none';
  $('#dict-skip').style.display = 'none';
  $('#dict-next').style.display = '';
}

$('#dict-check').addEventListener('click', checkDictAnswer);

$('#dict-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if (dictAnswered) dictNext();
    else checkDictAnswer();
  }
});

$('#dict-skip').addEventListener('click', () => {
  dictAnswered = true;
  dictWrong++;
  const answer = dictItems[dictIdx];
  dictResults.push({ answer, typed: '', ok: false });
  $('#dict-feedback').innerHTML = `<span class="answer">${esc(answer)}</span>`;
  $('#dict-score-live').innerHTML = `<span style="color:var(--green)">✓ ${dictCorrect}</span> &nbsp; <span style="color:var(--red)">✗ ${dictWrong}</span>`;
  $('#dict-check').style.display = 'none';
  $('#dict-skip').style.display = 'none';
  $('#dict-next').style.display = '';
});

function dictNext() {
  dictIdx++;
  if (dictIdx >= dictItems.length) { showDictResult(); return; }
  showDictItem();
  dictSpeak(dictItems[dictIdx]);
}

$('#dict-next').addEventListener('click', dictNext);

function showDictResult() {
  $('#dict-play').style.display = 'none';
  $('#dict-result').style.display = 'block';
  $('#dict-progress-fill').style.width = '100%';
  const total = dictCorrect + dictWrong;
  const pct = total ? Math.round((dictCorrect / total) * 100) : 0;
  $('#dict-r-correct').textContent = dictCorrect;
  $('#dict-r-wrong').textContent = dictWrong;
  $('#dict-r-pct').textContent = pct + '%';
  $('#dict-r-list').innerHTML = dictResults.map(r => `
    <div class="dict-r-item ${r.ok ? 'ok' : 'fail'}">
      <span class="dict-r-icon">${r.ok ? '✓' : '✗'}</span>
      <span class="dict-r-word">${esc(r.answer)}</span>
      ${!r.ok && r.typed ? `<span class="dict-r-typed">→ ${esc(r.typed)}</span>` : ''}
    </div>`).join('');
  saveDictHistory(total, dictCorrect, pct);
  recordStudy();
}

function saveDictHistory(total, correct, pct) {
  const hist = JSON.parse(localStorage.getItem('ielts-dict-history') || '[]');
  hist.unshift({ mode: dictMode, topic: dictTopic, total, correct, pct, date: Date.now() });
  if (hist.length > 30) hist.length = 30;
  localStorage.setItem('ielts-dict-history', JSON.stringify(hist));
  renderDictHistory();
}

function renderDictHistory() {
  const hist = JSON.parse(localStorage.getItem('ielts-dict-history') || '[]');
  const el = $('#dict-history');
  if (!el) return;
  if (!hist.length) { el.innerHTML = '<div class="empty-state"><i class="icon-ear"></i>Chưa có lịch sử</div>'; return; }
  el.innerHTML = hist.slice(0, 10).map(h => `
    <div class="timer-entry">
      <span class="timer-entry-label">${h.mode === 'word' ? 'Từ' : 'Câu'}${h.topic !== 'all' ? ' · ' + h.topic : ''}</span>
      <span style="color:var(--green)">${h.correct}/${h.total}</span>
      <span style="color:var(--accent);font-weight:700">${h.pct}%</span>
      <span class="timer-entry-meta">${new Date(h.date).toLocaleDateString('vi-VN')}</span>
    </div>`).join('');
}

$('#dict-quit').addEventListener('click', () => {
  speechSynthesis.cancel();
  if (dictResults.length) showDictResult();
  else { $('#dict-play').style.display = 'none'; $('#dict-setup').style.display = 'block'; }
});

$('#dict-retry').addEventListener('click', () => {
  $('#dict-result').style.display = 'none';
  $('#dict-setup').style.display = 'none';
  $('#dict-play').style.display = 'block';
  dictIdx = 0; dictCorrect = 0; dictWrong = 0; dictResults = [];
  dictItems = getDictItems();
  showDictItem();
});

$('#dict-back').addEventListener('click', () => {
  $('#dict-result').style.display = 'none';
  $('#dict-setup').style.display = 'block';
});

// Preload voices
if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = () => {};
renderDictHistory();

// ===== SEED SAMPLE DATA =====
function seedSampleData() {
  const isFirstLoad = !DATA_KEYS.some(k => localStorage.getItem('ielts-' + k));
  if (!isFirstLoad) return;

  const d = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const t = n => Date.now() - n * 86400000;

  // Vocabulary + Flashcards
  const vocab = [], cards = [];
  SAMPLE_VOCAB.forEach((s, i) => {
    const id = 'sv' + i;
    vocab.push({ ...s, id, created: t(Math.floor(i / 3)) });
    cards.push({ id: 'sf' + i, front: s.word, back: s.meaning, example: s.example, deck: 'general', score: Math.floor(Math.random() * 5) - 1, lastReview: i < 10 ? t(i % 3) : null });
  });

  // Notes
  const notes = [
    { id: 'sn1', skill: 'listening', title: 'Section 4 tips', content: 'Đọc trước câu hỏi trong 30s break.\nChú ý signal words: however, on the other hand.\nViết tắt khi nghe, hoàn thiện sau.', tag: 'tip', date: t(1) },
    { id: 'sn2', skill: 'writing', title: 'Task 2 template', content: 'Introduction: Paraphrase + thesis statement\nBody 1: Main idea + example\nBody 2: Counter argument + refutation\nConclusion: Restate + recommendation', tag: 'template', date: t(2) },
    { id: 'sn3', skill: 'reading', title: 'Lỗi hay mắc - True/False/NG', content: 'NOT GIVEN ≠ FALSE.\nNếu passage không đề cập → NG.\nNếu passage nói ngược lại → FALSE.', tag: 'mistake', date: t(0) },
    { id: 'sn4', skill: 'speaking', title: 'Part 2 - Describe a place', content: 'Where: Da Lat city\nWhen: Last summer\nWhat: Pine forests, flower gardens, Xuan Huong lake\nWhy memorable: Cool weather, peaceful atmosphere', tag: 'tip', date: t(3) },
    { id: 'sn5', skill: 'vocabulary', title: 'Collocations hay gặp', content: 'make progress, take measures, raise awareness\npay attention, draw conclusions, pose a threat', tag: 'vocab', date: t(1) },
  ];

  // Scores
  const scores = [
    { id: 'ss1', date: d(21), l: 4, r: 4, w: 4, s: 4.5, overall: 4, created: t(21) },
    { id: 'ss2', date: d(14), l: 4.5, r: 4.5, w: 4, s: 4.5, overall: 4.5, created: t(14) },
    { id: 'ss3', date: d(7), l: 5, r: 4.5, w: 4.5, s: 5, overall: 5, created: t(7) },
    { id: 'ss4', date: d(1), l: 5, r: 5, w: 5, s: 5, overall: 5, created: t(1) },
  ];

  // Sessions
  const sessions = [
    { id: 'se1', date: d(1), title: 'Listening Practice #3', content: 'Cambridge 17 Test 2 - Section 3,4\nĐúng 28/40. Cần cải thiện section 4.', skills: ['listening'], mood: 'good', created: t(1) },
    { id: 'se2', date: d(2), title: 'Writing Task 2', content: 'Topic: Technology in education\nViết xong trong 38 phút. Cần check grammar kỹ hơn.', skills: ['writing', 'vocabulary'], mood: 'ok', created: t(2) },
    { id: 'se3', date: d(0), title: 'Vocab + Reading', content: 'Học 10 từ mới topic Environment.\nLàm 1 passage True/False/NG.', skills: ['reading', 'vocabulary'], mood: 'great', created: t(0) },
  ];

  // Streak & History
  const history = [d(0), d(1), d(2), d(3), d(5), d(7), d(8), d(14)];
  const streak = { count: 4, lastDate: d(0) };

  // Checklist
  const checklist = [
    { date: d(0), items: { vocab: true, listen: true, read: false, write: false, speak: false } },
    { date: d(1), items: { vocab: true, listen: true, read: true, write: true, speak: false } },
  ];

  const settings = { targetBand: '5.0' };

  store.setAll({ vocabulary: vocab, flashcards: cards, notes, scores, sessions, streak, history, checklist, settings });
  toast('Chào mừng! Dữ liệu mẫu đã được tải.');
}

// ===== INIT =====
seedSampleData();
loadGithubConfig();
initCalendar();
refreshAll();
github.sync();
