const STORAGE_KEY = "my-study-log.entries.v1";
const GOOGLE_SHEETS_URL = "";
const SUBJECTS = ["国語", "算数", "社会", "理科", "音楽", "体育", "図工", "道徳", "英語", "総合的な学習"];

const form = document.querySelector("#study-form");
const dateInput = document.querySelector("#entry-date");
const subjectInput = document.querySelector("#entry-subject");
const taskInput = document.querySelector("#entry-task");
const learningMethodInput = document.querySelector("#entry-learning-method");
const understandingInput = document.querySelector("#entry-understanding");
const evaluationInput = document.querySelector("#entry-evaluation");
const contentInput = document.querySelector("#entry-content");
const reflectionInput = document.querySelector("#entry-reflection");
const clearButton = document.querySelector("#clear-button");
const entryList = document.querySelector("#entry-list");
const emptyState = document.querySelector("#empty-state");
const saveState = document.querySelector("#save-state");
const charCount = document.querySelector("#char-count");
const editingLabel = document.querySelector("#editing-label");
const entryCount = document.querySelector("#entry-count");
const averageEvaluation = document.querySelector("#average-evaluation");
const summaryRow = document.querySelector("#summary-row");
const subjectFilter = document.querySelector("#subject-filter");
const periodFilter = document.querySelector("#period-filter");
const learningMethodFilter = document.querySelector("#learning-method-filter");
const evaluationChart = document.querySelector("#evaluation-chart");
const evaluationSubjectFilter = document.querySelector("#evaluation-subject-filter");
const evaluationPeriodFilter = document.querySelector("#evaluation-period-filter");

let entries = loadEntries();

function loadEntries() {
  const rawEntries = localStorage.getItem(STORAGE_KEY);
  if (!rawEntries) return [];
  try {
    const parsedEntries = JSON.parse(rawEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

async function sendEntryToGoogleSheets(entry) {
  if (!GOOGLE_SHEETS_URL) {
    return false;
  }

  await fetch(GOOGLE_SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify(entry),
  });

  return true;
}

function getTodayIso() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${dateText}T00:00:00`));
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sortEntries() {
  entries.sort((a, b) => b.date.localeCompare(a.date));
}

function getFilteredEntries() {
  const selectedSubject = subjectFilter.value;
  const selectedPeriod = periodFilter.value;
  const selectedLearningMethod = learningMethodFilter.value;
  const period = getPeriodRange(selectedPeriod);
  return entries.filter((entry) => {
    const matchesPeriod = !period || (entry.date >= period.start && entry.date <= period.end);
    return (selectedSubject === "all" || entry.subject === selectedSubject)
      && (selectedLearningMethod === "all" || entry.learningMethod === selectedLearningMethod)
      && matchesPeriod;
  });
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPeriodRange(period) {
  if (period === "all") return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayOfWeek = start.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  if (period === "this-week") {
    start.setDate(start.getDate() + mondayOffset);
    return { start: toIsoDate(start), end: toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)) };
  }
  if (period === "last-week") {
    start.setDate(start.getDate() + mondayOffset - 7);
    return { start: toIsoDate(start), end: toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)) };
  }
  if (period === "this-month") {
    return { start: toIsoDate(new Date(start.getFullYear(), start.getMonth(), 1)), end: toIsoDate(new Date(start.getFullYear(), start.getMonth() + 1, 0)) };
  }
  return { start: toIsoDate(new Date(start.getFullYear(), start.getMonth() - 1, 1)), end: toIsoDate(new Date(start.getFullYear(), start.getMonth(), 0)) };
}

function renderEntries() {
  const filteredEntries = getFilteredEntries();
  entryList.innerHTML = filteredEntries.map((entry) => `
    <li class="entry-card">
      <div class="entry-topline">
        <span class="entry-date">${formatDate(entry.date)}</span>
        <span class="learning-method-badge">${escapeHtml(entry.subject)} ・ ${escapeHtml(entry.learningMethod || "学び方未設定")}</span>
      </div>
      ${entry.task ? `<p class="entry-task"><strong>本時の課題:</strong> ${escapeHtml(entry.task)}</p>` : ""}
      <div class="understanding">目標とする姿: <span aria-label="${entry.understanding}/5">${"★".repeat(entry.understanding)}${"☆".repeat(5 - entry.understanding)}</span></div>
      <div class="understanding">本時の評価: <span aria-label="${entry.evaluation || "-"}/5">${entry.evaluation ? `${"★".repeat(entry.evaluation)}${"☆".repeat(5 - entry.evaluation)}` : "未設定"}</span></div>
      <p class="entry-note">${escapeHtml(entry.content)}</p>
      ${(entry.reflection || entry.nextAction) ? `<p class="next-action"><strong>本時の振り返り:</strong> ${escapeHtml(entry.reflection || entry.nextAction)}</p>` : ""}
      <div class="entry-actions">
        <button type="button" data-action="edit" data-date="${entry.date}">編集</button>
        <button class="danger-button" type="button" data-action="delete" data-date="${entry.date}">削除</button>
      </div>
    </li>
  `).join("");
  emptyState.innerHTML = entries.length && !filteredEntries.length
    ? "<strong>条件に合う記録がありません</strong><span>検索ワードや科目フィルターを変えてみてください。</span>"
    : "<strong>まだ学習記録がありません</strong><span>学んだことを保存すると、ここに表示されます。</span>";
  emptyState.hidden = filteredEntries.length > 0;
  entryList.hidden = filteredEntries.length === 0;
}

function renderSubjectFilter() {
  const currentValue = subjectFilter.value;
  const subjects = getSubjects();
  subjectFilter.innerHTML = `<option value="all">すべての科目</option>${subjects.map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join("")}`;
  subjectFilter.value = subjects.includes(currentValue) ? currentValue : "all";
}

function getSubjects() {
  return SUBJECTS;
}

function renderEvaluationSubjectFilter() {
  const currentValue = evaluationSubjectFilter.value;
  const subjects = getSubjects();
  evaluationSubjectFilter.innerHTML = `<option value="all">すべての科目</option>${subjects.map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join("")}`;
  evaluationSubjectFilter.value = subjects.includes(currentValue) ? currentValue : "all";
}

function renderSummary() {
  entryCount.textContent = entries.length;
  renderEvaluationSubjectFilter();
  const selectedSubject = evaluationSubjectFilter.value;
  const selectedPeriod = evaluationPeriodFilter.value;
  const period = getPeriodRange(selectedPeriod);
  const evaluatedEntries = entries.filter((entry) =>
    (selectedSubject === "all" || entry.subject === selectedSubject)
    && (!period || (entry.date >= period.start && entry.date <= period.end))
    && Number.isInteger(Number(entry.evaluation))
    && Number(entry.evaluation) >= 1
    && Number(entry.evaluation) <= 5,
  );
  const average = evaluatedEntries.length
    ? evaluatedEntries.reduce((sum, entry) => sum + Number(entry.evaluation), 0) / evaluatedEntries.length
    : 0;
  averageEvaluation.textContent = evaluatedEntries.length ? average.toFixed(1) : "-";
  const counts = entries.reduce((result, entry) => {
    const method = entry.learningMethod || "学び方未設定";
    result[method] = (result[method] || 0) + 1;
    return result;
  }, {});
  summaryRow.innerHTML = Object.entries(counts).sort(([, a], [, b]) => b - a)
    .map(([method, count]) => `<span class="summary-chip">${escapeHtml(method)} ${count}件</span>`).join("");
  renderEvaluationChart();
}

function renderEvaluationChart() {
  const selectedSubject = evaluationSubjectFilter.value;
  const period = getPeriodRange(evaluationPeriodFilter.value);
  const evaluatedEntries = entries
    .filter((entry) =>
      (selectedSubject === "all" || entry.subject === selectedSubject)
      && (!period || (entry.date >= period.start && entry.date <= period.end))
      && Number.isInteger(Number(entry.evaluation))
      && Number(entry.evaluation) >= 1
      && Number(entry.evaluation) <= 5,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!evaluatedEntries.length) {
    evaluationChart.innerHTML = '<p class="chart-empty">本時の評価を保存すると、ここに表示されます</p>';
    return;
  }

  const width = 640;
  const height = 190;
  const left = 34;
  const right = 12;
  const top = 14;
  const bottom = 34;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const xStep = evaluatedEntries.length > 1 ? chartWidth / (evaluatedEntries.length - 1) : 0;
  const points = evaluatedEntries.map((entry, index) => {
    const value = Number(entry.evaluation);
    const x = evaluatedEntries.length > 1 ? left + index * xStep : width / 2;
    const y = top + ((5 - value) / 4) * chartHeight;
    return { entry, value, x, y };
  });
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const gridLines = [1, 2, 3, 4, 5].map((value) => {
    const y = top + ((5 - value) / 4) * chartHeight;
    return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" /><text x="8" y="${y + 4}">${value}</text>`;
  }).join("");
  const pointMarkup = points.map(({ entry, value, x, y }) => `
    <circle cx="${x}" cy="${y}" r="5" />
    <text class="evaluation-value" x="${x}" y="${y - 10}">${value}</text>
    <text class="evaluation-date" x="${x}" y="${height - 10}">${escapeHtml(entry.date.slice(5))}</text>
  `).join("");

  evaluationChart.innerHTML = `
    <svg class="evaluation-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="本時の評価の変化">
      <g class="evaluation-grid">${gridLines}</g>
      <polyline class="evaluation-line" points="${linePoints}" />
      <g class="evaluation-points">${pointMarkup}</g>
    </svg>
  `;
}

function render() {
  sortEntries();
  renderSubjectFilter();
  renderSummary();
  renderEntries();
}

function updateCharCount() {
  charCount.textContent = contentInput.value.length;
}

function updateSaveState(text) {
  saveState.textContent = text;
}

function resetForm() {
  form.reset();
  dateInput.value = getTodayIso();
  editingLabel.textContent = "今日の学習記録を書いています";
  updateCharCount();
  updateSaveState("未保存");
}

function loadEntryIntoForm(entry) {
  dateInput.value = entry.date;
  subjectInput.value = entry.subject;
  taskInput.value = entry.task || "";
  learningMethodInput.value = entry.learningMethod || "";
  understandingInput.value = entry.understanding;
  evaluationInput.value = entry.evaluation || "";
  contentInput.value = entry.content;
  reflectionInput.value = entry.reflection || entry.nextAction || "";
  editingLabel.textContent = `${formatDate(entry.date)}の記録を編集中`;
  updateCharCount();
  updateSaveState("編集中");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const date = dateInput.value;
  const subject = subjectInput.value.trim();
  const task = taskInput.value.trim();
  const learningMethod = learningMethodInput.value;
  const understanding = Number(understandingInput.value);
  const evaluation = Number(evaluationInput.value);
  const content = contentInput.value.trim();
  const reflection = reflectionInput.value.trim();
  if (!date || !subject || !task || !learningMethod || !understanding || !evaluation || !content) {
    updateSaveState("入力を確認");
    return;
  }
  const existingIndex = entries.findIndex((entry) => entry.date === date);
  const now = new Date().toISOString();
  const nextEntry = {
    id: existingIndex >= 0 ? entries[existingIndex].id : createId(),
    date, subject, task, learningMethod, understanding, evaluation, content, reflection,
    createdAt: existingIndex >= 0 ? entries[existingIndex].createdAt : now,
    updatedAt: now,
  };
  if (existingIndex >= 0) entries[existingIndex] = nextEntry;
  else entries.push(nextEntry);
  saveEntries();
  render();
  loadEntryIntoForm(nextEntry);
  try {
    const sentToGoogleSheets = await sendEntryToGoogleSheets(nextEntry);
    updateSaveState(sentToGoogleSheets ? "保存・Sheets送信済み" : "保存済み（Sheets未設定）");
  } catch (error) {
    console.error("Googleスプレッドシートへの送信に失敗しました", error);
    updateSaveState("保存済み（Sheets送信失敗）");
  }
});

dateInput.addEventListener("change", () => {
  const existingEntry = entries.find((entry) => entry.date === dateInput.value);
  if (existingEntry) {
    loadEntryIntoForm(existingEntry);
    return;
  }
  subjectInput.value = "";
  taskInput.value = "";
  learningMethodInput.value = "";
  understandingInput.value = "";
  evaluationInput.value = "";
  contentInput.value = "";
  reflectionInput.value = "";
  editingLabel.textContent = `${formatDate(dateInput.value)}の記録を書いています`;
  updateCharCount();
  updateSaveState("未保存");
});

form.addEventListener("input", () => {
  updateCharCount();
  updateSaveState("編集中");
});

clearButton.addEventListener("click", resetForm);
subjectFilter.addEventListener("change", renderEntries);
periodFilter.addEventListener("change", renderEntries);
learningMethodFilter.addEventListener("change", renderEntries);
evaluationSubjectFilter.addEventListener("change", renderSummary);
evaluationPeriodFilter.addEventListener("change", renderSummary);

entryList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const entry = entries.find((item) => item.date === button.dataset.date);
  if (!entry) return;
  if (button.dataset.action === "edit") {
    loadEntryIntoForm(entry);
    document.querySelector(".editor-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (button.dataset.action === "delete" && confirm(`${formatDate(entry.date)}の学習記録を削除しますか？`)) {
    entries = entries.filter((item) => item.date !== entry.date);
    saveEntries();
    render();
    resetForm();
  }
});

dateInput.value = getTodayIso();
updateCharCount();
render();
