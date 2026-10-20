/* ========================================================
   Financial Literacy Course — Core Application JS
   ======================================================== */

/* ---------- PROGRESS TRACKING ---------- */
const STORAGE_KEY = 'finlit_progress';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function markSessionComplete(sessionNum) {
  const p = getProgress();
  p[`session_${sessionNum}`] = p[`session_${sessionNum}`] || {};
  p[`session_${sessionNum}`].visited = true;
  p[`session_${sessionNum}`].completedAt = new Date().toISOString();
  saveProgress(p);
  updateNavProgress();
}

function saveQuizScore(sessionNum, score, total) {
  const p = getProgress();
  p[`session_${sessionNum}`] = p[`session_${sessionNum}`] || {};
  p[`session_${sessionNum}`].quizScore = score;
  p[`session_${sessionNum}`].quizTotal = total;
  p[`session_${sessionNum}`].quizPct   = Math.round((score / total) * 100);
  p[`session_${sessionNum}`].quizDate  = new Date().toISOString();
  saveProgress(p);
}

function getCompletedCount() {
  const p = getProgress();
  return Object.values(p).filter(v => v.visited).length;
}

function updateNavProgress() {
  const el = document.getElementById('navProgress');
  if (!el) return;
  const n = getCompletedCount();
  el.textContent = `${n}/10 Sessions`;
}

/* ---------- MOBILE NAV ---------- */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', mobileMenu.classList.contains('open'));
  });
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });
}

/* ---------- ACTIVE NAV LINK ---------- */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === path) a.classList.add('active');
  });
}

/* ---------- SESSION STATUS DOTS (landing) ---------- */
function updateSessionDots() {
  const p = getProgress();
  for (let i = 1; i <= 10; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (!dot) continue;
    const data = p[`session_${i}`];
    if (!data) continue;
    if (data.quizScore !== undefined) {
      dot.classList.add('completed'); dot.title = `Completed — Quiz: ${data.quizPct}%`;
    } else if (data.visited) {
      dot.classList.add('in-progress'); dot.title = 'In Progress';
    }
  }
}

/* ---------- QUIZ ENGINE ---------- */
function initQuiz(questions, sessionNum) {
  let current = 0;
  let score = 0;
  let answered = false;

  const questionEl  = document.getElementById('questionText');
  const optionsEl   = document.getElementById('optionsList');
  const feedbackEl  = document.getElementById('feedbackBox');
  const nextBtn     = document.getElementById('nextBtn');
  const progressBar = document.getElementById('quizProgressBar');
  const progressTxt = document.getElementById('quizProgressText');
  const quizCard    = document.getElementById('quizCard');
  const resultCard  = document.getElementById('quizResult');

  function renderQuestion() {
    if (current >= questions.length) { showResult(); return; }
    answered = false;
    const q = questions[current];
    const pct = Math.round((current / questions.length) * 100);

    progressTxt.textContent = `Question ${current + 1} of ${questions.length}`;
    progressBar.style.width = pct + '%';

    questionEl.textContent = q.question;
    optionsEl.innerHTML = '';
    feedbackEl.className = 'feedback-box';
    feedbackEl.textContent = '';
    nextBtn.disabled = true;

    const letters = ['A','B','C','D'];
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `<span class="option-letter">${letters[i]}</span> ${opt}`;
      btn.addEventListener('click', () => selectOption(btn, i, q));
      optionsEl.appendChild(btn);
    });
  }

  function selectOption(btn, idx, q) {
    if (answered) return;
    answered = true;
    const buttons = optionsEl.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    btn.classList.add('selected');
    if (idx === q.correct) {
      score++;
      btn.classList.add('correct');
      feedbackEl.className = 'feedback-box correct show';
      feedbackEl.innerHTML = '✅ <strong>Correct!</strong> ' + q.explanation;
    } else {
      btn.classList.add('incorrect');
      buttons[q.correct].classList.add('correct');
      feedbackEl.className = 'feedback-box incorrect show';
      feedbackEl.innerHTML = '❌ <strong>Not quite.</strong> ' + q.explanation;
    }
    nextBtn.disabled = false;
  }

  nextBtn && nextBtn.addEventListener('click', () => {
    current++;
    renderQuestion();
  });

  function showResult() {
    saveQuizScore(sessionNum, score, questions.length);
    markSessionComplete(sessionNum);
    quizCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
    const pct = Math.round((score / questions.length) * 100);
    document.getElementById('scoreNum').textContent = score + '/' + questions.length;
    document.getElementById('scorePct').textContent = pct + '%';
    const starsEl = document.getElementById('scoreStars');
    starsEl.textContent = pct >= 90 ? '⭐⭐⭐' : pct >= 70 ? '⭐⭐' : '⭐';
    const msg = document.getElementById('scoreMsg');
    if (pct === 100) msg.textContent = "Perfect score! You're a financial superstar! 🎉";
    else if (pct >= 80) msg.textContent = "Great work! You really understand this topic!";
    else if (pct >= 60) msg.textContent = "Good effort! Review the lesson and try again to improve.";
    else msg.textContent = "Keep practicing! Review the lesson and give it another shot.";
    document.getElementById('resultPct').textContent = pct + '%';
    progressBar.style.width = '100%';
    progressTxt.textContent = 'Quiz Complete!';
  }

  // Restart
  const restartBtn = document.getElementById('restartQuiz');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      current = 0; score = 0; answered = false;
      quizCard.classList.remove('hidden');
      resultCard.classList.add('hidden');
      renderQuestion();
    });
  }

  renderQuestion();
}

/* ---------- WORKSHEET SAVE ---------- */
function initWorksheet(sheetId) {
  const storageKey = `ws_${sheetId}`;
  const form = document.getElementById('worksheetForm');
  if (!form) return;

  // Restore
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey)) || {};
    form.querySelectorAll('[data-ws]').forEach(el => {
      const key = el.getAttribute('data-ws');
      if (saved[key]) el.value = saved[key];
    });
  } catch {}

  // Auto-save
  form.querySelectorAll('[data-ws]').forEach(el => {
    el.addEventListener('input', () => {
      const data = {};
      form.querySelectorAll('[data-ws]').forEach(e => data[e.getAttribute('data-ws')] = e.value);
      try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch {}
    });
  });

  // Print
  const printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  // Clear
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (!confirm('Clear all worksheet entries?')) return;
    form.querySelectorAll('[data-ws]').forEach(el => el.value = '');
    try { localStorage.removeItem(storageKey); } catch {}
  });
}

/* ---------- CALCULATOR HELPERS ---------- */
function calcSavings() {
  const amt   = parseFloat(document.getElementById('calcAmt')?.value) || 0;
  const rate  = parseFloat(document.getElementById('calcRate')?.value) / 100 || 0;
  const years = parseInt(document.getElementById('calcYears')?.value) || 0;
  const result = amt * Math.pow(1 + rate, years);
  const el = document.getElementById('calcResult');
  if (el) {
    el.textContent = `After ${years} years: $${result.toFixed(2)} (Growth: $${(result - amt).toFixed(2)})`;
    el.parentElement.classList.add('show');
  }
}

function calcBudget() {
  const income = parseFloat(document.getElementById('budgetIncome')?.value) || 0;
  const needs  = parseFloat(document.getElementById('budgetNeeds')?.value)  || 0;
  const wants  = parseFloat(document.getElementById('budgetWants')?.value)  || 0;
  const savings= parseFloat(document.getElementById('budgetSavings')?.value)|| 0;
  const total  = needs + wants + savings;
  const rem    = income - total;
  const el = document.getElementById('budgetResult');
  if (el) {
    el.innerHTML = `
      <strong>Total Budgeted:</strong> $${total.toFixed(2)}<br>
      <strong>Remaining (Unallocated):</strong> <span style="color:${rem >= 0 ? 'green' : 'red'}">$${rem.toFixed(2)}</span><br>
      ${rem < 0 ? '<em style="color:red">⚠️ You\'ve over-allocated your budget!</em>' : rem === 0 ? '<em style="color:green">✅ Budget perfectly balanced!</em>' : '<em style="color:green">💡 Consider allocating remaining funds to savings.</em>'}
    `;
    el.parentElement.classList.add('show');
  }
}

/* ---------- DASHBOARD ---------- */
function initDashboard() {
  const p = getProgress();
  let sessionsVisited = 0, sessionsQuizzed = 0, avgScore = 0, scoreCount = 0;

  const tbody = document.getElementById('dashTableBody');
  if (!tbody) return;

  for (let i = 1; i <= 10; i++) {
    const d = p[`session_${i}`] || {};
    if (d.visited) sessionsVisited++;
    let scoreHTML = '<span class="score-badge score-none">—</span>';
    if (d.quizPct !== undefined) {
      sessionsQuizzed++;
      avgScore += d.quizPct;
      scoreCount++;
      const cls = d.quizPct >= 80 ? 'score-high' : d.quizPct >= 60 ? 'score-mid' : 'score-low';
      scoreHTML = `<span class="score-badge ${cls}">${d.quizPct}%</span>`;
    }
    const statusHTML = d.quizPct !== undefined
      ? '<span class="badge badge-green">✅ Complete</span>'
      : d.visited
        ? '<span class="badge badge-gold">📖 In Progress</span>'
        : '<span class="badge" style="background:#f3f4f6;color:#6b7280">Not Started</span>';
    const dateStr = d.completedAt
      ? new Date(d.completedAt).toLocaleDateString() : '—';
    const sessionTitles = [
      'What Is Money?','Needs vs. Wants','Budgeting Basics',
      'Saving & Goals','Banking 101','Credit & Debt',
      'Earning Money','Investing Intro','Smart Shopping','Money Mindset'
    ];
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>Session ${i}</strong></td>
      <td>${sessionTitles[i-1]}</td>
      <td>${statusHTML}</td>
      <td>${scoreHTML}</td>
      <td>${dateStr}</td>
      <td><a href="sessions/session${i}.html" class="btn btn-sm btn-outline">Open →</a></td>
    `;
    tbody.appendChild(row);
  }

  document.getElementById('statVisited').textContent  = sessionsVisited;
  document.getElementById('statQuizzed').textContent  = sessionsQuizzed;
  document.getElementById('statAvgScore').textContent = scoreCount ? Math.round(avgScore / scoreCount) + '%' : '—';
  document.getElementById('statStreak').textContent   = sessionsVisited;

  // Overall progress bar
  const pct = Math.round((sessionsVisited / 10) * 100);
  const bar = document.getElementById('overallBar');
  if (bar) bar.style.width = pct + '%';
  const lbl = document.getElementById('overallPct');
  if (lbl) lbl.textContent = pct + '%';

  // Build mini chart
  buildScoreChart(p);
}

function buildScoreChart(p) {
  const canvas = document.getElementById('scoreChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const barW = W / 12, gap = barW * 0.3, maxH = H - 40;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, W, H);

  for (let i = 1; i <= 10; i++) {
    const d = p[`session_${i}`] || {};
    const pct = d.quizPct || 0;
    const x = (i - 0.5) * (W / 10.5) + barW * 0.1;
    const bH = (pct / 100) * maxH;
    const y = H - bH - 20;

    // Bar
    const grad = ctx.createLinearGradient(0, y, 0, H - 20);
    grad.addColorStop(0, pct >= 80 ? '#4f46e5' : pct >= 60 ? '#f59e0b' : '#ef4444');
    grad.addColorStop(1, pct >= 80 ? '#818cf8' : pct >= 60 ? '#fcd34d' : '#fca5a5');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW - gap, bH, [4, 4, 0, 0]);
    ctx.fill();

    // Label
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`S${i}`, x + (barW - gap) / 2, H - 5);

    if (pct) {
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 10px system-ui';
      ctx.fillText(pct + '%', x + (barW - gap) / 2, y - 4);
    }
  }
}

/* ---------- RESET ALL PROGRESS ---------- */
function resetAllProgress() {
  if (!confirm('Reset ALL progress? This cannot be undone.')) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  // Clear worksheets
  for (let i = 1; i <= 10; i++) {
    try { localStorage.removeItem(`ws_session${i}`); } catch {}
  }
  location.reload();
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  setActiveNav();
  updateNavProgress();
  updateSessionDots();
  if (document.getElementById('dashTableBody')) initDashboard();
});

// Expose helpers
window.calcSavings  = calcSavings;
window.calcBudget   = calcBudget;
window.resetAllProgress = resetAllProgress;
window.initQuiz     = initQuiz;
window.initWorksheet = initWorksheet;
window.markSessionComplete = markSessionComplete;
