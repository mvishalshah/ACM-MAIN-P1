const KEY = "weightedAttendanceTracker_v2";
const BACKUP_INFO_KEY = "weightedAttendanceTracker_backupInfo";
const BACKUP_VERSION = 1;
const APP_NAME = "Weighted Attendance Tracker";
let chart1, chart2, chart3, monthDate = new Date();
let data = loadData();
function defaultData() {
  return {
    settings: { year: new Date().getFullYear(), target: 75, dateFormat: "DD MMM YYYY" },
    students: [],
    inactiveStudents: [],
    courses: [],
    classes: [],
    sections: [],
    subjects: [{ id: "math", name: "Mathematics", weight: 1 }, { id: "physics", name: "Physics", weight: 1 }, { id: "chem", name: "Chemistry", weight: 1 }],
    teachers: [],
    timetable: [],
    attendanceSessions: [],
    attendance: [],
    sessions: [],
    holidays: {}
  };
}
function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return normalizeData(parsed);
  } catch (error) {
    return normalizeData(null);
  }
}
function normalizeData(raw) {
  const base = defaultData();
  const incoming = raw && typeof raw === "object" ? raw : {};
  const next = {
    ...base,
    ...incoming,
    settings: { ...base.settings, ...(incoming.settings || {}) },
    students: Array.isArray(incoming.students) ? incoming.students : [],
    inactiveStudents: Array.isArray(incoming.inactiveStudents) ? incoming.inactiveStudents : [],
    courses: Array.isArray(incoming.courses) ? incoming.courses : [],
    classes: Array.isArray(incoming.classes) ? incoming.classes : [],
    sections: Array.isArray(incoming.sections) ? incoming.sections : [],
    subjects: Array.isArray(incoming.subjects) && incoming.subjects.length ? incoming.subjects : base.subjects,
    teachers: Array.isArray(incoming.teachers) ? incoming.teachers : [],
    timetable: Array.isArray(incoming.timetable) ? incoming.timetable : [],
    attendance: Array.isArray(incoming.attendance) ? incoming.attendance : [],
    attendanceSessions: Array.isArray(incoming.attendanceSessions) ? incoming.attendanceSessions : (Array.isArray(incoming.sessions) ? incoming.sessions : []),
    sessions: Array.isArray(incoming.attendanceSessions) ? incoming.attendanceSessions : (Array.isArray(incoming.sessions) ? incoming.sessions : []),
    holidays: incoming.holidays && typeof incoming.holidays === "object" ? incoming.holidays : {}
  };
  return next;
}
function ensureDataShape() {
  if (!data || typeof data !== "object") data = defaultData();
  data.settings = { ...defaultData().settings, ...(data.settings || {}) };
  data.students = Array.isArray(data.students) ? data.students : [];
  data.inactiveStudents = Array.isArray(data.inactiveStudents) ? data.inactiveStudents : [];
  data.subjects = Array.isArray(data.subjects) && data.subjects.length ? data.subjects : defaultData().subjects;
  data.courses = Array.isArray(data.courses) ? data.courses : [];
  data.classes = Array.isArray(data.classes) ? data.classes : [];
  data.sections = Array.isArray(data.sections) ? data.sections : [];
  data.teachers = Array.isArray(data.teachers) ? data.teachers : [];
  data.timetable = Array.isArray(data.timetable) ? data.timetable : [];
  data.attendance = Array.isArray(data.attendance) ? data.attendance : [];
  data.attendanceSessions = Array.isArray(data.attendanceSessions) ? data.attendanceSessions : [];
  data.sessions = Array.isArray(data.sessions) ? data.sessions : data.attendanceSessions;
  data.holidays = data.holidays && typeof data.holidays === "object" ? data.holidays : {};
  data.students.forEach((student, index) => {
    student.studentId = student.studentId || student.id || `STU-${String(index + 1).padStart(3, "0")}`;
    student.id = student.id || student.studentId;
    student.status = student.status || (student.isActive === false ? "inactive" : "active");
    student.className = student.className || "Unassigned";
    student.section = student.section || "A";
    student.classId = student.classId || [student.className, student.department || "", student.section, student.academicYear || ""].join("|").toLowerCase();
  });
}
function setStatus(message, type = "saved") {
  const statusNode = document.getElementById("dataStatus");
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.className = `data-status ${type}`;
}
function toast(message) {
  const toastNode = document.getElementById("toast");
  if (!toastNode) return;
  toastNode.textContent = message;
  toastNode.style.display = "block";
  clearTimeout(toastNode._timer);
  toastNode._timer = setTimeout(() => { toastNode.style.display = "none"; }, 2200);
}
function saveData() {
  try {
    ensureDataShape();
    localStorage.setItem(KEY, JSON.stringify(data));
    setStatus("● Changes saved", "saved");
    return true;
  } catch (error) {
    setStatus("⚠ Unable to save changes", "error");
    return false;
  }
}
function saveAllData() {
  return saveData();
}
function save() {
  return saveData();
}
function records(sessionId) {
  return data.attendance.filter((record) => record.sessionId === sessionId);
}
function student(studentId) {
  return findStudentById(studentId);
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function formatDate(dateValue) {
  const date = new Date(dateValue || Date.now());
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function pct(a, b) {
  return b ? Math.round((a / b) * 1000) / 10 : 0;
}
function getStudentAttendance(studentId) {
  const list = data.attendance.filter((record) => record.studentId === studentId);
  if (!list.length) return 0;
  const present = list.filter((record) => record.status === "present").length;
  return pct(present, list.length);
}
function findStudentById(studentId) {
  return data.students.find((item) => item.id === studentId || item.studentId === studentId);
}
function updateBackupInfo() {
  const node = document.getElementById("backupInfo");
  if (!node) return;
  const lastBackup = localStorage.getItem(BACKUP_INFO_KEY);
  const formatted = lastBackup ? new Date(lastBackup).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" }) : "No backup yet";
  node.innerHTML = `<div>Last Backup: <strong>${escapeHtml(formatted)}</strong></div><div>Current Students: <strong>${data.students.length}</strong></div><div>Current Attendance Records: <strong>${data.attendance.length.toLocaleString()}</strong></div>`;
}
function renderDashboard() {
  const totalStudents = data.students.length;
  const todayPresent = data.attendance.filter((record) => record.date === today() && record.status === "present").length;
  const todayAbsent = data.attendance.filter((record) => record.date === today() && record.status === "absent").length;
  const allPresent = data.attendance.filter((record) => record.status === "present").length;
  const allAbsent = data.attendance.filter((record) => record.status === "absent").length;
  const totalRecords = data.attendance.length;
  const avg = totalRecords ? pct(allPresent, totalRecords) : 0;
  const belowTarget = data.students.filter((student) => getStudentAttendance(student.id) < Number(data.settings.target || 0)).length;
  const ids = ["totalStudents", "totalSubjects", "averageAttendance", "belowTarget", "presentToday", "absentToday"];
  const values = [
    totalStudents,
    data.subjects.length,
    `${avg}%`,
    belowTarget,
    todayPresent,
    todayAbsent
  ];
  ids.forEach((id, index) => {
    const node = document.getElementById(id);
    if (node) node.textContent = values[index];
  });
  const table = document.getElementById("dashboardTable");
  if (table) {
    const cells = data.students.slice(0, 8).map((student) => `<tr><td>${escapeHtml(student.name || "Unnamed")}</td><td>${getStudentAttendance(student.id)}%</td></tr>`).join("");
    table.innerHTML = `<div class="tablewrap"><table><thead><tr><th>Student</th><th>Attendance</th></tr></thead><tbody>${cells || '<tr><td colspan="2" class="empty">No students recorded</td></tr>'}</tbody></table></div>`;
  }
  const chartCtx = document.getElementById("studentChart");
  if (chartCtx) {
    if (chart1) chart1.destroy();
    chart1 = new Chart(chartCtx, {
      type: "bar",
      data: {
        labels: ["Present", "Absent"],
        datasets: [{ data: [todayPresent, todayAbsent], backgroundColor: ["#22c55e", "#f87171"] }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }
  const distCtx = document.getElementById("distributionChart");
  if (distCtx) {
    if (chart2) chart2.destroy();
    chart2 = new Chart(distCtx, {
      type: "doughnut",
      data: {
        labels: ["Present", "Absent"],
        datasets: [{ data: [allPresent, allAbsent], backgroundColor: ["#34d399", "#f87171"] }]
      },
      options: { responsive: true }
    });
  }
  const trendCtx = document.getElementById("trendChart");
  if (trendCtx) {
    if (chart3) chart3.destroy();
    const labels = [];
    const valuesList = [];
    for (let step = 5; step >= 0; step--) {
      const date = new Date();
      date.setDate(date.getDate() - step);
      const iso = date.toISOString().slice(0, 10);
      labels.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      valuesList.push(data.attendance.filter((record) => record.date === iso && record.status === "present").length);
    }
    chart3 = new Chart(trendCtx, {
      type: "line",
      data: {
        labels,
        datasets: [{ data: valuesList, borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,0.2)", fill: true, tension: 0.35 }]
      },
      options: { responsive: true }
    });
  }
}
function renderStudents() {
  const list = document.getElementById("studentList");
  const count = document.getElementById("studentCountLabel");
  if (count) count.textContent = `${data.students.length} students`;
  if (!list) return;
  const searchValue = (document.getElementById("studentSearch")?.value || "").toLowerCase();
  const filtered = data.students.filter((student) => !searchValue || `${student.name || ""} ${student.rollNo || ""}`.toLowerCase().includes(searchValue));
  list.innerHTML = filtered.length ? filtered.map((student) => `
    <div class="student-row">
      <div><strong>${escapeHtml(student.name || "Unnamed")}</strong><div class="small">ID: ${escapeHtml(student.studentId || student.id || "-")}</div></div>
      <div><span class="small">Roll</span><br>${escapeHtml(student.rollNo || "-")}</div>
      <div><span class="small">Class</span><br>${escapeHtml(student.className || "-")}</div>
      <div><span class="small">Section</span><br>${escapeHtml(student.section || "-")}</div>
      <div><span class="small">Contact</span><br>${escapeHtml(student.contact || "-")}</div>
      <div class="student-actions">
        <button class="row-btn" data-action="edit-student" data-student-id="${student.id}">Edit</button>
        <button class="row-btn" data-action="toggle-student" data-student-id="${student.id}">${student.isActive === false ? "Activate" : "Deactivate"}</button>
        <button class="row-btn danger" data-action="delete-student" data-student-id="${student.id}">Delete</button>
      </div>
    </div>
  `).join("") : '<div class="empty">No students match the current search.</div>';
}
function getStudentStatus(student) {
  return student?.status || (student?.isActive === false ? "inactive" : "active");
}
function getClassId(student) {
  return student.classId || [student.className || "Unassigned", student.department || "", student.section || "A", student.academicYear || ""].join("|").toLowerCase();
}
function getStudentGroups() {
  const groups = [];
  const seen = new Set();
  data.students.forEach((student) => {
    const classId = `${student.className || "Unassigned"}|${student.section || "A"}`.toLowerCase();
    if (seen.has(classId)) return;
    seen.add(classId);
    groups.push({ classId, className: student.className || "Unassigned", section: student.section || "A", department: student.department || "" });
  });
  return groups;
}
function renderAttendanceSelectors() {
  const classSelect = document.getElementById("attendanceClass");
  const sectionSelect = document.getElementById("attendanceSection");
  const subjectSelect = document.getElementById("attendanceSubject");
  if (!classSelect || !sectionSelect || !subjectSelect) return;
  const groups = getStudentGroups();
  const previousClass = classSelect.value;
  classSelect.innerHTML = groups.map((group) => `<option value="${escapeHtml(group.classId)}">${escapeHtml(group.className)}${group.department ? ` · ${escapeHtml(group.department)}` : ""}</option>`).join("");
  if (groups.some((group) => group.classId === previousClass)) classSelect.value = previousClass;
  const selectedGroup = groups.find((group) => group.classId === classSelect.value) || groups[0];
  const sections = [...new Set(data.students.filter((student) => `${student.className || "Unassigned"}|${student.section || "A"}`.toLowerCase().startsWith(`${selectedGroup?.className || ""}|`.toLowerCase())).map((student) => student.section || "A"))];
  const previousSection = sectionSelect.value;
  sectionSelect.innerHTML = sections.map((section) => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join("");
  if (sections.includes(previousSection)) sectionSelect.value = previousSection;
  subjectSelect.innerHTML = data.subjects.map((subject) => `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`).join("");
}
function getCurrentAttendanceStudents() {
  const classId = document.getElementById("attendanceClass")?.value || "";
  const section = document.getElementById("attendanceSection")?.value || "";
  return data.students.filter((student) => getStudentStatus(student) === "active" && `${student.className || "Unassigned"}|${student.section || "A"}`.toLowerCase() === `${classId}` && student.section === section);
}
function renderAttendanceCounters() {
  const rows = [...document.querySelectorAll("#attendanceList .attendance-row")];
  const present = rows.filter((row) => row.dataset.status === "present").length;
  const absent = rows.filter((row) => row.dataset.status === "absent").length;
  const totalNode = document.getElementById("attendanceTotal");
  const presentNode = document.getElementById("attendancePresent");
  const absentNode = document.getElementById("attendanceAbsent");
  const percentageNode = document.getElementById("attendancePercentage");
  if (totalNode) totalNode.textContent = rows.length;
  if (presentNode) presentNode.textContent = present;
  if (absentNode) absentNode.textContent = absent;
  if (percentageNode) percentageNode.textContent = `${pct(present, rows.length)}%`;
}
function renderMarkAttendance() {
  renderAttendanceSelectors();
  const list = document.getElementById("attendanceList");
  if (!list) return;
  const previousMarks = Object.fromEntries([...list.querySelectorAll(".attendance-row")].map((row) => [row.dataset.studentId, row.dataset.status]));
  const students = getCurrentAttendanceStudents();
  list.innerHTML = students.length ? students.map((student) => {
    const status = previousMarks[student.studentId] || "";
    return `<div class="attendance-row" data-student-id="${escapeHtml(student.studentId)}" data-status="${escapeHtml(status)}"><span>${escapeHtml(student.rollNo || "-")}</span><span>${escapeHtml(student.studentId)}</span><strong>${escapeHtml(student.name || "Unnamed")}</strong><div class="attendance-actions"><button type="button" class="mini-btn ${status === "present" ? "selected" : ""}" data-attendance-status="present">Present</button><button type="button" class="mini-btn ${status === "absent" ? "selected" : ""}" data-attendance-status="absent">Absent</button></div></div>`;
  }).join("") : `<div class="empty attendance-empty"><strong>No active students found for this class and section.</strong><div class="toolbar"><button type="button" class="ghost" data-go-students="true">Go to Students Management</button><button type="button" class="primary" data-go-students="true">Add Student</button></div></div>`;
  renderAttendanceCounters();
}
function markVisibleAttendance(status) {
  document.querySelectorAll("#attendanceList .attendance-row").forEach((row) => {
    row.dataset.status = status;
    row.querySelectorAll("[data-attendance-status]").forEach((button) => button.classList.toggle("selected", button.dataset.attendanceStatus === status));
  });
  renderAttendanceCounters();
}
function saveAttendanceSession() {
  const rows = [...document.querySelectorAll("#attendanceList .attendance-row")];
  const students = getCurrentAttendanceStudents();
  if (!students.length) return toast("No active students found for this class and section.");
  if (rows.some((row) => !row.dataset.status)) return toast("Mark Present or Absent for every student first.");
  const classId = document.getElementById("attendanceClass")?.value || "";
  const group = getStudentGroups().find((item) => item.classId === classId);
  const subjectId = document.getElementById("attendanceSubject")?.value || "";
  const subject = data.subjects.find((item) => item.id === subjectId);
  const sessionId = `session-${uid()}`;
  const session = { id: sessionId, sessionId, classId, className: group?.className || "", department: group?.department || "", section: document.getElementById("attendanceSection")?.value || "", subjectId, subjectName: subject?.name || "Subject", date: document.getElementById("sessionDate")?.value || today(), startTime: document.getElementById("sessionStart")?.value || "", endTime: document.getElementById("sessionEnd")?.value || "", teacherName: document.getElementById("sessionTeacher")?.value || "", room: document.getElementById("sessionRoom")?.value || "", markedAt: new Date().toISOString(), studentIdsSnapshot: students.map((student) => student.studentId), totalStudentsAtTime: students.length };
  data.attendanceSessions.push(session);
  data.sessions = data.attendanceSessions;
  rows.forEach((row) => data.attendance.push({ sessionId, studentId: row.dataset.studentId, status: row.dataset.status, date: session.date, markedAt: session.markedAt }));
  saveData();
  refreshApplicationUI();
  toast("Attendance saved successfully.");
}
function renderReportStudents() {
  const select = document.getElementById("reportStudent");
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="all">All Students</option>${data.students.map((student) => `<option value="${student.id}">${escapeHtml(student.rollNo || "")}. ${escapeHtml(student.name || "Unnamed")}</option>`).join("")}`;
  if (current && data.students.some((student) => student.id === current)) select.value = current;
}
function renderClassSelectors() {
  const classSubject = document.getElementById("classSubject");
  if (classSubject) {
    const currentValue = classSubject.value;
    classSubject.innerHTML = data.subjects.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.name)}</option>`).join("");
    if (currentValue) classSubject.value = currentValue;
  }
}
function renderCalendar() {
  const node = document.getElementById("calendarGrid");
  const title = document.getElementById("monthTitle");
  if (!node || !title) return;
  title.textContent = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let html = days.map((label) => `<div class="calendar-day header">${label}</div>`).join("");
  for (let dayIndex = 0; dayIndex < 42; dayIndex++) {
    const current = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayIndex - startOffset + 1);
    const iso = current.toISOString().slice(0, 10);
    const isCurrentMonth = current.getMonth() === monthDate.getMonth();
    const isToday = iso === today();
    const count = data.attendance.filter((record) => record.date === iso).length;
    html += `<div class="calendar-day ${isCurrentMonth ? "" : "other-month"} ${isToday ? "today" : ""}"><div class="calendar-date">${current.getDate()}</div>${count ? `<div class="calendar-badge">${count}</div>` : ""}</div>`;
  }
  node.innerHTML = html;
}
function renderAttendanceHistory() {
  const node = document.getElementById("historyList");
  if (!node) return;
  node.innerHTML = data.attendanceSessions.length ? data.attendanceSessions.slice().reverse().map((session) => {
    const stats = { total: data.attendance.filter((record) => record.sessionId === session.id).length, present: data.attendance.filter((record) => record.sessionId === session.id && record.status === "present").length };
    return `<div class="panel"><div class="panelhead"><h4>${escapeHtml(session.subjectName || "Subject")} · ${escapeHtml(session.className || "Class")} / ${escapeHtml(session.section || "")}</h4><span class="small">${stats.present}/${stats.total} present</span></div><div class="small">${escapeHtml(session.date || today())} · ${escapeHtml(session.teacherName || "Teacher")}</div></div>`;
  }).join("") : '<div class="empty">No attendance history available.</div>';
}
function renderStatistics() {
  renderDashboard();
}
function renderSubjectStatistics() {
  // compatibility hook for project architecture.
}
function renderTargetCalculations() {
  // compatibility hook for project architecture.
}
function refreshApplicationUI() {
  ensureDataShape();
  renderDashboard();
  renderStudents();
  renderReportStudents();
  renderClassSelectors();
  renderMarkAttendance();
  renderAttendanceHistory();
  renderCalendar();
  renderStatistics();
  renderSubjectStatistics();
  renderTargetCalculations();
  updateBackupInfo();
}
function generateStudents(amount) {
  const count = Math.max(1, Math.min(200, Number(amount) || 0));
  if (count <= data.students.length) {
    toast("Reducing never deletes students; remove them manually.");
    return;
  }
  for (let i = data.students.length + 1; i <= count; i++) {
    const id = `ST${String(i).padStart(3, "0")}`;
    data.students.push({ id, studentId: id, rollNo: i, name: `Student ${String(i).padStart(2, "0")}`, className: "B.Tech", section: "IT", contact: "", course: "", isActive: true });
  }
  saveData();
  refreshApplicationUI();
  toast(`${count} students ready`);
}
function showModal(title, html, actions) {
  const modal = document.getElementById("appModal");
  if (!modal) return;
  document.getElementById("appModalTitle").textContent = title;
  document.getElementById("appModalBody").innerHTML = html;
  const actionsContainer = document.getElementById("appModalActions");
  actionsContainer.innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.className = action.className || "ghost";
    button.dataset.action = action.action || "close";
    actionsContainer.appendChild(button);
  });
  modal.classList.add("open");
}
function closeModal() {
  const modal = document.getElementById("appModal");
  if (modal) modal.classList.remove("open");
}
function openClearStudentsModal() {
  showModal(
    "Clear All Students?",
    `<p>This will remove all currently active student records from the student list.</p><p>Your attendance history and backup files will not be automatically deleted.</p><p>Are you sure?</p>`,
    [
      { label: "Cancel", action: "close", className: "ghost" },
      { label: "Clear Active Students", action: "delete-active-students", className: "danger" },
      { label: "Clear All Student Records", action: "delete-all-student-records", className: "danger" }
    ]
  );
}
function clearActiveStudents() {
  data.students = [];
  saveData();
  refreshApplicationUI();
  closeModal();
  toast("All active students cleared.");
}
function warnPermanentClear() {
  showModal(
    "This will permanently remove all student records from this browser.",
    `<p>Make sure you have a backup first.</p>`,
    [
      { label: "Cancel", action: "close", className: "ghost" },
      { label: "Continue", action: "confirm-clear-all-student-records", className: "danger" }
    ]
  );
}
function clearAllStudentRecords() {
  data.students = [];
  data.inactiveStudents = [];
  saveData();
  refreshApplicationUI();
  closeModal();
  toast("All student records cleared.");
}
function showClearApplicationDataModal() {
  showModal(
    "Clear All Application Data?",
    `<p>This will permanently remove all application data, including students, classes, subjects, timetable, attendance sessions, attendance records, and settings.</p><p>Download a backup before continuing if you want to keep this data.</p>`,
    [
      { label: "Cancel", action: "close", className: "ghost" },
      { label: "Download Backup First", action: "download-backup-then-clear", className: "primary" },
      { label: "Clear All Data", action: "confirm-clear-all-data", className: "danger" }
    ]
  );
}
function clearAllApplicationData() {
  data = normalizeData(defaultData());
  saveData();
  refreshApplicationUI();
  closeModal();
  toast("Application data cleared.");
}
function createBackupPayload() {
  return {
    appName: APP_NAME,
    backupVersion: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    data: {
      students: data.students,
      inactiveStudents: data.inactiveStudents,
      courses: data.courses,
      classes: data.classes,
      sections: data.sections,
      subjects: data.subjects,
      teachers: data.teachers,
      timetable: data.timetable,
      attendanceSessions: data.attendanceSessions,
      attendance: data.attendance,
      settings: data.settings,
      holidays: data.holidays
    }
  };
}
function downloadBackupFile(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const stamp = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "").replace(":", "");
  anchor.download = `attendance-backup-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  localStorage.setItem(BACKUP_INFO_KEY, new Date().toISOString());
  updateBackupInfo();
}
function backupCurrentData() {
  const payload = createBackupPayload();
  downloadBackupFile(payload);
  toast("Backup downloaded successfully.");
}
function migrateBackup(backup) {
  if (!backup || typeof backup !== "object") return null;
  if (backup.backupVersion === 1) return backup;
  return null;
}
function validateBackup(backup) {
  if (!backup || typeof backup !== "object") throw new Error("Invalid backup format");
  if (backup.appName !== APP_NAME) throw new Error("Invalid application identifier");
  if (!Number.isInteger(backup.backupVersion) || backup.backupVersion !== BACKUP_VERSION) throw new Error("Unsupported backup version");
  if (!backup.data || typeof backup.data !== "object") throw new Error("Missing backup data");
  const keys = ["students", "inactiveStudents", "courses", "classes", "sections", "subjects", "teachers", "timetable", "attendanceSessions", "attendance", "settings"];
  for (const key of keys) {
    if (!(key in backup.data)) throw new Error(`Missing ${key}`);
  }
  for (const key of ["students", "inactiveStudents", "courses", "classes", "sections", "subjects", "teachers", "timetable", "attendanceSessions", "attendance"]) {
    if (!Array.isArray(backup.data[key])) throw new Error(`${key} must be an array`);
  }
  if (!backup.data.settings || typeof backup.data.settings !== "object") throw new Error("Settings missing");
  const validStudents = new Set(backup.data.students.filter((item) => item && item.id).map((item) => item.id));
  const validSessions = new Set(backup.data.attendanceSessions.filter((item) => item && item.id).map((item) => item.id));
  for (const record of backup.data.attendance) {
    if (record.studentId && validStudents.size && !validStudents.has(record.studentId)) {
      throw new Error("Attendance references an invalid student");
    }
    if (record.sessionId && validSessions.size && !validSessions.has(record.sessionId)) {
      throw new Error("Attendance references an invalid session");
    }
  }
  return true;
}
let pendingRestoreBackup = null;
function showRestoreConfirmation(backup) {
  const summary = {
    students: backup.data.students.length,
    classes: backup.data.classes.length,
    subjects: backup.data.subjects.length,
    sessions: backup.data.attendanceSessions.length,
    attendance: backup.data.attendance.length
  };
  pendingRestoreBackup = backup;
  showModal(
    "Restore Backup?",
    `<p>This backup contains:</p><p>Students: <strong>${summary.students}</strong> · Classes: <strong>${summary.classes}</strong> · Subjects: <strong>${summary.subjects}</strong></p><p>Attendance Sessions: <strong>${summary.sessions}</strong> · Attendance Records: <strong>${summary.attendance}</strong></p><p>Restoring this backup will replace the current application data.</p><p>It is recommended that you create a backup of your current data first.</p>`,
    [
      { label: "Cancel", action: "close", className: "ghost" },
      { label: "Backup Current Data First", action: "backup-before-restore", className: "primary" },
      { label: "Restore Backup", action: "confirm-restore-backup", className: "danger" }
    ]
  );
}
function restoreBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(String(reader.result || ""));
      const migrated = migrateBackup(json);
      validateBackup(migrated);
      showRestoreConfirmation(migrated);
    } catch (error) {
      console.error(error);
      showModal("Invalid or corrupted backup file.", "<p>Your current data has NOT been changed.</p>", [{ label: "OK", action: "close", className: "primary" }]);
    }
  };
  reader.readAsText(file);
}
function applyRestoredBackup(backup) {
  const migrated = migrateBackup(backup);
  if (!migrated) {
    showModal("Invalid or corrupted backup file.", "<p>Your current data has NOT been changed.</p>", [{ label: "OK", action: "close", className: "primary" }]);
    return;
  }
  data = normalizeData(migrated.data);
  saveData();
  refreshApplicationUI();
  closeModal();
  showModal(
    "Backup Restored Successfully",
    `<p>Students: <strong>${data.students.length}</strong> · Classes: <strong>${data.classes.length}</strong> · Subjects: <strong>${data.subjects.length}</strong></p><p>Attendance Sessions: <strong>${data.attendanceSessions.length}</strong></p><p>All application data has been restored.</p>`,
    [{ label: "OK", action: "close", className: "primary" }]
  );
  toast("Backup restored successfully.");
}
function handleModalAction(action) {
  if (action === "close") {
    closeModal();
    return;
  }
  if (action === "delete-active-students") {
    clearActiveStudents();
    return;
  }
  if (action === "delete-all-student-records") {
    warnPermanentClear();
    return;
  }
  if (action === "confirm-clear-all-student-records") {
    clearAllStudentRecords();
    return;
  }
  if (action === "download-backup-then-clear") {
    backupCurrentData();
    showClearApplicationDataModal();
    return;
  }
  if (action === "confirm-clear-all-data") {
    clearAllApplicationData();
    return;
  }
  if (action === "backup-before-restore") {
    backupCurrentData();
    closeModal();
    return;
  }
  if (action === "confirm-restore-backup") {
    if (pendingRestoreBackup) applyRestoredBackup(pendingRestoreBackup);
    return;
  }
}
function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}
function parseCsvText(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.trim().length > 0);
  if (!lines.length) return [];
  const headerLine = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headerLine.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}
function normalizedKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function candidateKey(student) {
  return [student.studentId || student.id || "", student.rollNo || "", student.className || "", student.section || ""].map((value) => String(value).trim()).join("|");
}
function findDuplicateStudent(studentCandidate) {
  const id = normalizedKey(studentCandidate.studentId || studentCandidate.id);
  const roll = normalizedKey(studentCandidate.rollNo);
  const className = normalizedKey(studentCandidate.className);
  const section = normalizedKey(studentCandidate.section);
  return data.students.find((student) => {
    const sameId = id && normalizedKey(student.studentId || student.id) === id;
    const sameRoll = roll && normalizedKey(student.rollNo) === roll && className && normalizedKey(student.className) === className && section && normalizedKey(student.section) === section;
    return sameId || sameRoll;
  }) || null;
}
function importStudentsFromCsv(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseCsvText(String(reader.result || ""));
      if (!rows.length) {
        toast("CSV file is empty.");
        return;
      }
      const fallback = {
        course: data.settings.currentCourse || "",
        className: data.settings.currentClass || "",
        section: data.settings.currentSection || "",
        department: data.settings.department || ""
      };
      const seen = new Set();
      const summary = { newStudents: 0, updatedStudents: 0, skippedDuplicates: 0, invalidRows: 0 };
      rows.forEach((row, index) => {
        const normalized = {};
        Object.keys(row).forEach((key) => {
          normalized[normalizedKey(key)] = row[key];
        });
        const studentName = String(normalized.studentname || normalized.name || "").trim();
        if (!studentName) {
          summary.invalidRows += 1;
          toast(`Row ${index + 2}: Student Name is missing.`);
          return;
        }
        const candidate = {
          id: String(normalized.studentid || normalized.studentidfield || normalized.id || "").trim() || `ST${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          studentId: String(normalized.studentid || normalized.studentidfield || normalized.id || "").trim() || `ST${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          rollNo: String(normalized.rollno || normalized.roll || normalized.rollnumber || ""),
          name: studentName,
          className: String(normalized.classname || normalized.class || fallback.className || "").trim(),
          section: String(normalized.section || fallback.section || "").trim(),
          course: String(normalized.course || fallback.course || "").trim(),
          department: String(normalized.department || fallback.department || "").trim(),
          contact: String(normalized.email || normalized.contact || normalized.phone || "").trim(),
          isActive: true
        };
        const duplicateKey = candidateKey(candidate);
        if (seen.has(duplicateKey)) {
          summary.skippedDuplicates += 1;
          return;
        }
        seen.add(duplicateKey);
        const existing = findDuplicateStudent(candidate);
        if (existing) {
          existing.studentId = existing.studentId || candidate.studentId || existing.id;
          existing.rollNo = existing.rollNo || candidate.rollNo || "";
          existing.name = existing.name || candidate.name;
          existing.className = candidate.className || existing.className || fallback.className || "";
          existing.section = candidate.section || existing.section || fallback.section || "";
          existing.course = candidate.course || existing.course || fallback.course || "";
          existing.department = candidate.department || existing.department || fallback.department || "";
          existing.contact = candidate.contact || existing.contact || "";
          existing.isActive = existing.isActive !== false;
          summary.updatedStudents += 1;
        } else {
          data.students.push(candidate);
          summary.newStudents += 1;
        }
      });
      saveData();
      refreshApplicationUI();
      showModal(
        "CSV Import Complete",
        `<p>New Students: <strong>${summary.newStudents}</strong></p><p>Updated Students: <strong>${summary.updatedStudents}</strong></p><p>Skipped/Duplicate: <strong>${summary.skippedDuplicates}</strong></p><p>Invalid Rows: <strong>${summary.invalidRows}</strong></p><p>Total Active Students: <strong>${data.students.length}</strong></p>`,
        [{ label: "OK", action: "close", className: "primary" }]
      );
      toast("CSV import complete");
    } catch (error) {
      console.error(error);
      toast("Unable to import CSV file.");
    }
  };
  reader.readAsText(file);
}
function attachEvents() {
  document.querySelectorAll(".nav").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav").forEach((navButton) => navButton.classList.remove("active"));
      button.classList.add("active");
      const page = button.dataset.page;
      document.querySelectorAll(".page").forEach((section) => section.classList.toggle("active", section.id === page));
      const pageTitle = document.getElementById("pageTitle");
      if (pageTitle) pageTitle.textContent = button.textContent;
    });
  });
  document.getElementById("saveSettings")?.addEventListener("click", () => {
    const year = Number(document.getElementById("academicYear")?.value || new Date().getFullYear());
    const target = Number(document.getElementById("targetPct")?.value || 75);
    data.settings.year = year;
    data.settings.target = target;
    saveData();
    refreshApplicationUI();
    toast("Settings saved");
  });
  document.getElementById("generateStudents")?.addEventListener("click", () => {
    generateStudents(document.getElementById("studentCount")?.value || 0);
  });
  document.getElementById("clearAllStudentsButton")?.addEventListener("click", openClearStudentsModal);
  document.getElementById("clearData")?.addEventListener("click", showClearApplicationDataModal);
  document.getElementById("backupCurrentData")?.addEventListener("click", backupCurrentData);
  document.getElementById("restoreData")?.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    restoreBackup(file);
    event.target.value = "";
  });
  document.getElementById("studentSearch")?.addEventListener("input", renderStudents);
  document.getElementById("attendanceClass")?.addEventListener("change", renderMarkAttendance);
  document.getElementById("attendanceSection")?.addEventListener("change", renderMarkAttendance);
  document.getElementById("markAllPresent")?.addEventListener("click", () => markVisibleAttendance("present"));
  document.getElementById("markAllAbsent")?.addEventListener("click", () => markVisibleAttendance("absent"));
  document.getElementById("resetMarks")?.addEventListener("click", () => { document.querySelectorAll("#attendanceList .attendance-row").forEach((row) => { row.dataset.status = ""; row.querySelectorAll("[data-attendance-status]").forEach((button) => button.classList.remove("selected")); }); renderAttendanceCounters(); });
  document.getElementById("saveAttendance")?.addEventListener("click", saveAttendanceSession);
  document.getElementById("attendanceList")?.addEventListener("click", (event) => {
    const statusButton = event.target.closest("[data-attendance-status]");
    if (statusButton) {
      const row = statusButton.closest(".attendance-row");
      row.dataset.status = statusButton.dataset.attendanceStatus;
      row.querySelectorAll("[data-attendance-status]").forEach((button) => button.classList.toggle("selected", button === statusButton));
      renderAttendanceCounters();
    }
    if (event.target.closest("[data-go-students]")) document.querySelector('[data-page="students"]')?.click();
  });
  document.getElementById("studentForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("studentName").value.trim();
    if (!name) {
      toast("Student name is required.");
      return;
    }
    const entry = {
      id: uid(),
      studentId: document.getElementById("studentRoll").value ? `ST${document.getElementById("studentRoll").value}` : uid(),
      rollNo: document.getElementById("studentRoll").value,
      name,
      className: document.getElementById("studentClass").value || "Class 11",
      section: document.getElementById("studentSection").value || "A",
      contact: document.getElementById("studentContact").value || "",
      course: "",
      isActive: true
    };
    data.students.push(entry);
    saveData();
    refreshApplicationUI();
    event.target.reset();
    toast("Student added");
  });
  document.getElementById("studentList")?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    const studentId = button.dataset.studentId;
    const person = findStudentById(studentId);
    if (!person) return;
    if (action === "delete-student") {
      data.students = data.students.filter((student) => student.id !== studentId);
      saveData();
      refreshApplicationUI();
      toast("Student deleted");
    }
    if (action === "toggle-student") {
      person.isActive = person.isActive === false ? true : false;
      saveData();
      refreshApplicationUI();
      toast(person.isActive ? "Student activated" : "Student deactivated");
    }
    if (action === "edit-student") {
      document.getElementById("studentName").value = person.name || "";
      document.getElementById("studentRoll").value = person.rollNo || "";
      document.getElementById("studentClass").value = person.className || "";
      document.getElementById("studentSection").value = person.section || "";
      document.getElementById("studentContact").value = person.contact || "";
      data.students = data.students.filter((student) => student.id !== person.id);
      saveData();
      refreshApplicationUI();
      toast("Student details loaded for edit");
    }
  });
  document.getElementById("importStudents")?.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importStudentsFromCsv(file);
    event.target.value = "";
  });
  document.getElementById("prevMonth")?.addEventListener("click", () => {
    monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById("nextMonth")?.addEventListener("click", () => {
    monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    renderCalendar();
  });
  document.getElementById("appModalActions")?.addEventListener("click", (event) => {
    const actionEl = event.target.closest("button");
    if (!actionEl) return;
    handleModalAction(actionEl.dataset.action);
  });
  document.getElementById("studentCount") && (document.getElementById("studentCount").value = 30);
  document.getElementById("academicYear") && (document.getElementById("academicYear").value = data.settings.year || new Date().getFullYear());
  document.getElementById("targetPct") && (document.getElementById("targetPct").value = data.settings.target || 75);
}
function initApp() {
  ensureDataShape();
  attachEvents();
  refreshApplicationUI();
  setStatus("● Data saved", "saved");
}
document.addEventListener("DOMContentLoaded", initApp);
window.data = data;
window.refreshApplicationUI = refreshApplicationUI;
window.saveAllData = saveAllData;
window.backupCurrentData = backupCurrentData;
window.restoreBackup = restoreBackup;
window.generateStudents = generateStudents;
window.importStudentsFromCsv = importStudentsFromCsv;
window.clearActiveStudents = clearActiveStudents;
window.clearAllApplicationData = clearAllApplicationData;
