const STORAGE_KEY = "my-study-log.entries.v1";

const form = document.querySelector("#study-form");
const dateInput = document.querySelector("#entry-date");
const subjectInput = document.querySelector("#entry-subject");
const durationInput = document.querySelector("#entry-duration");
const understandingInput = document.querySelector("#entry-understanding");
const contentInput = document.querySelector("#entry-content");
const nextActionInput = document.querySelector("#entry-next-action");
const clearButton = document.querySelector("#clear-button");
const entryList = document.querySelector("#entry-list");
const emptyState = document.querySelector("#empty-state");
const saveState = document.querySelector("#save-state");
const charCount = document.querySelector("#char-count");
const editingLabel = document.querySelector("#editing-label");
const entryCount = document.querySelector("#entry-count");
const totalDuration = document.querySelector("#total-duration");
const averageUnderstanding = document.querySelector("#average-understanding");
const summaryRow = document.querySelector("#summary-row");
const searchInput = document.querySelector("#search-input");
const subjectFilter = document.querySelector("#subject-filter");
const progressChart = document.querySelector("#progress-chart");
const progressMessage = document.querySelector("#progress-message");

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
  const query = searchInput.value.trim().toLowerCase();
  const selectedSubject = subjectFilter.value;
  return entries.filter((entry) => {
    const text = `${entry.date} ${entry.subject} ${entry.content} ${entry.nextAction}`.toLowerCase();
    return (selectedSubject === "all" || entry.subject === selectedSubject) && (!query || text.includes(query));
  });
}

function renderEntries() {
  const filteredEntries = getFilteredEntries();
  entryList.innerHTML = filteredEntries.map((entry) => `
    <li class="entry-card">
      <div class="entry-topline">
        <span class="entry-date">${formatDate(entry.date)}</span>
        <span class="duration-badge">${escapeHtml(entry.subject)} ・ ${entry.duration}分</span>
      </div>
      <div class="understanding">理解度: <span aria-label="${entry.understanding}/5">${"★".repeat(entry.understanding)}${"☆".repeat(5 - entry.understanding)}</span></div>
      <p class="entry-note">${escapeHtml(entry.content)}</p>
      ${entry.nextAction ? `<p class="next-action"><strong>次にやること:</strong> ${escapeHtml(entry.nextAction)}</p>` : ""}
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
  const subjects = [...new Set(entries.map((entry) => entry.subject))].sort();
  subjectFilter.innerHTML = `<option value="all">すべての科目</option>${subjects.map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join("")}`;
  subjectFilter.value = subjects.includes(currentValue) ? currentValue : "all";
}

function renderSummary() {
  entryCount.textContent = entries.length;
  const minutes = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const average = entries.length ? entries.reduce((sum, entry) => sum + entry.understanding, 0) / entries.length : 0;
  totalDuration.textContent = minutes;
  averageUnderstanding.textContent = entries.length ? average.toFixed(1) : "-";
  const counts = entries.reduce((result, entry) => {
    result[entry.subject] = (result[entry.subject] || 0) + 1;
    return result;
  }, {});
  summaryRow.innerHTML = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5)
    .map(([subject, count]) => `<span class="summary-chip">${escapeHtml(subject)} ${count}件</span>`).join("");
}

function renderProgress() {
  if (!entries.length) {
    progressChart.innerHTML = "";
    progressMessage.textContent = "記録を保存すると集計されます";
    return;
  }
  progressMessage.textContent = "学習を積み重ねています";
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).reverse();
  const maxDuration = Math.max(...recent.map((entry) => entry.duration), 1);
  progressChart.innerHTML = recent.map((entry) => `
    <div class="bar-item" title="${escapeHtml(entry.subject)}: ${entry.duration}分">
      <span class="bar-value">${entry.duration}</span>
      <div class="bar" style="height: ${Math.max(12, (entry.duration / maxDuration) * 100)}%"></div>
      <span class="bar-label">${escapeHtml(entry.date.slice(5))}</span>
    </div>
  `).join("");
}

function render() {
  sortEntries();
  renderSubjectFilter();
  renderSummary();
  renderProgress();
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
  durationInput.value = entry.duration;
  understandingInput.value = entry.understanding;
  contentInput.value = entry.content;
  nextActionInput.value = entry.nextAction || "";
  editingLabel.textContent = `${formatDate(entry.date)}の記録を編集中`;
  updateCharCount();
  updateSaveState("編集中");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const date = dateInput.value;
  const subject = subjectInput.value.trim();
  const duration = Number(durationInput.value);
  const understanding = Number(understandingInput.value);
  const content = contentInput.value.trim();
  const nextAction = nextActionInput.value.trim();
  if (!date || !subject || !duration || !understanding || !content) {
    updateSaveState("入力を確認");
    return;
  }
  const existingIndex = entries.findIndex((entry) => entry.date === date);
  const now = new Date().toISOString();
  const nextEntry = {
    id: existingIndex >= 0 ? entries[existingIndex].id : createId(),
    date, subject, duration, understanding, content, nextAction,
    createdAt: existingIndex >= 0 ? entries[existingIndex].createdAt : now,
    updatedAt: now,
  };
  if (existingIndex >= 0) entries[existingIndex] = nextEntry;
  else entries.push(nextEntry);
  saveEntries();
  render();
  loadEntryIntoForm(nextEntry);
  updateSaveState("保存済み");
});

dateInput.addEventListener("change", () => {
  const existingEntry = entries.find((entry) => entry.date === dateInput.value);
  if (existingEntry) {
    loadEntryIntoForm(existingEntry);
    return;
  }
  subjectInput.value = "";
  durationInput.value = "";
  understandingInput.value = "";
  contentInput.value = "";
  nextActionInput.value = "";
  editingLabel.textContent = `${formatDate(dateInput.value)}の記録を書いています`;
  updateCharCount();
  updateSaveState("未保存");
});

form.addEventListener("input", () => {
  updateCharCount();
  updateSaveState("編集中");
});

clearButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderEntries);
subjectFilter.addEventListener("change", renderEntries);

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
