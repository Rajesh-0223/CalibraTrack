
"use strict";

// CalibraTrack - Step 2: Instrument inventory CRUD

const DAY_MS = 24 * 60 * 60 * 1000;

function dateOffset(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

let instruments = [
  {
    id: "CAL-001", name: "Digital Multimeter",
    type: "Electrical", manufacturer: "Fluke",
    serialNumber: "DMM-1001", location: "Electrical Lab",
    lastCalibration: dateOffset(-335), intervalDays: 365
  },
  {
    id: "CAL-002", name: "Digital Temperature Indicator",
    type: "Thermal", manufacturer: "WIKA",
    serialNumber: "DTI-1002", location: "Thermal Lab",
    lastCalibration: dateOffset(-350), intervalDays: 365
  },
  {
    id: "CAL-003", name: "Pressure Gauge",
    type: "Pressure", manufacturer: "Ashcroft",
    serialNumber: "PG-1003", location: "Test Bench A",
    lastCalibration: dateOffset(-370), intervalDays: 365
  },
  {
    id: "CAL-004", name: "Digital Vernier Caliper",
    type: "Dimensional", manufacturer: "Mitutoyo",
    serialNumber: "VC-1004", location: "Mechanical Lab",
    lastCalibration: dateOffset(-200), intervalDays: 365
  },
  {
    id: "CAL-005", name: "RTD Temperature Sensor",
    type: "Thermal", manufacturer: "Testo",
    serialNumber: "RTD-1005", location: "Thermal Lab",
    lastCalibration: dateOffset(-355), intervalDays: 365
  },
  {
    id: "CAL-006", name: "Clamp Meter",
    type: "Electrical", manufacturer: "Fluke",
    serialNumber: "CM-1006", location: "Electrical Lab",
    lastCalibration: dateOffset(-100), intervalDays: 365
  },
  {
    id: "CAL-007", name: "Digital Pressure Calibrator",
    type: "Pressure", manufacturer: "Druck",
    serialNumber: "DPC-1007", location: "Test Bench B",
    lastCalibration: dateOffset(-340), intervalDays: 365
  },
  {
    id: "CAL-008", name: "Digital Stopwatch",
    type: "Electronic", manufacturer: "Casio",
    serialNumber: "SW-1008", location: "Quality Lab",
    lastCalibration: dateOffset(-60), intervalDays: 365
  }
];


/* =================================
   SAVE AND LOAD INSTRUMENT DATA
================================= */

const STORAGE_KEY = "calibraTrackInstruments";

function saveInstruments() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(instruments)
    );
  } catch (error) {
    console.error("Unable to save instrument data:", error);
    alert("Unable to save data in this browser.");
  }
}

function loadInstruments() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData !== null) {
      const parsedData = JSON.parse(savedData);

      if (Array.isArray(parsedData)) {
        instruments = parsedData;
      }
    }
  } catch (error) {
    console.error("Unable to load instrument data:", error);
  }
}

// Load previously saved records when the application starts.
loadInstruments();


const $ = (id) => document.getElementById(id);

const modal = $("instrumentModal");
const form = $("instrumentForm");
const formError = $("formError");

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + Number(days));
  return date;
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "short", year: "numeric" }
  );
}


function getInstrumentStatus(instrument) {
  // Find the latest calibration record for this instrument.
  const latestRecord = calibrationHistory
    .filter((record) => record.assetId === instrument.id)
    .sort((a, b) =>
      b.calibrationDate.localeCompare(a.calibrationDate)
    )[0];

  // A failed calibration requires immediate attention.
  if (latestRecord?.result === "Fail") {
    return {
      label: "Calibration Failed",
      className: "status-overdue",
      daysRemaining: 0
    };
  }

  // A conditional result requires review.
  if (latestRecord?.result === "Conditional") {
    return {
      label: "Review Required",
      className: "status-due",
      daysRemaining: 0
    };
  }

  // Use the most recent successful calibration date.
  const lastCalibrationDate =
    latestRecord?.result === "Pass" &&
    latestRecord.calibrationDate > instrument.lastCalibration
      ? latestRecord.calibrationDate
      : instrument.lastCalibration;

  // Calculate the next due date.
  const dueDate = addDays(
    lastCalibrationDate,
    instrument.intervalDays
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil(
    (dueDate.getTime() - today.getTime()) / DAY_MS
  );

  if (daysRemaining < 0) {
    return {
      label: "Overdue",
      className: "status-overdue",
      daysRemaining
    };
  }

  if (daysRemaining <= 30) {
    return {
      label: "Due Soon",
      className: "status-due",
      daysRemaining
    };
  }

  return {
    label: "Valid",
    className: "status-valid",
    daysRemaining
  };
}


function getNextDueDate(instrument) {
  const latestPass = calibrationHistory
    .filter(
      (record) =>
        record.assetId === instrument.id &&
        record.result === "Pass"
    )
    .sort((a, b) =>
      b.calibrationDate.localeCompare(a.calibrationDate)
    )[0];

  const lastCalibrationDate =
    latestPass &&
    latestPass.calibrationDate > instrument.lastCalibration
      ? latestPass.calibrationDate
      : instrument.lastCalibration;

  return toDateInputValue(
    addDays(lastCalibrationDate, instrument.intervalDays)
  );
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderDashboard() {
  const statuses = instruments.map((instrument) => ({
    instrument,
    status: getInstrumentStatus(instrument)
  }));

  const counts = {
    valid: statuses.filter(x => x.status.label === "Valid").length,
    due: statuses.filter(x => x.status.label === "Due Soon").length,
    overdue: statuses.filter(x => x.status.label === "Overdue").length
  };

  $("totalCount").textContent = instruments.length;
  $("validCount").textContent = counts.valid;
  $("dueCount").textContent = counts.due;
  $("overdueCount").textContent = counts.overdue;

  renderTable(statuses);
  renderAttentionList(statuses);
  renderChart(counts);
}

function renderTable(statuses) {
  const tbody = $("instrumentTableBody");

  if (!statuses.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">No matching instruments found.</td></tr>
    `;
    return;
  }

  tbody.innerHTML = statuses.map(({ instrument, status }) => `
    <tr>
      <td><strong>${escapeHTML(instrument.id)}</strong></td>
      <td>${escapeHTML(instrument.name)}</td>
      <td>${escapeHTML(instrument.location)}</td>
      <td>${formatDate(instrument.lastCalibration)}</td>
      <td>${formatDate(getNextDueDate(instrument))}</td>
      <td>
        <span class="status-badge ${status.className}">
          ${status.label}
        </span>
      </td>
      <td>
        <button class="action-btn edit-btn"
          data-action="edit" data-id="${escapeHTML(instrument.id)}">
          Edit
        </button>
        <button class="action-btn delete-btn"
          data-action="delete" data-id="${escapeHTML(instrument.id)}">
          Delete
        </button>
      </td>
    </tr>
  `).join("");
}

function renderAttentionList(statuses) {
  const container = $("attentionList");

  const items = statuses
    .filter(({ status }) => status.label !== "Valid")
    .sort((a, b) => a.status.daysRemaining - b.status.daysRemaining);

  if (!items.length) {
    container.innerHTML =
      '<p class="empty-state">No upcoming or overdue instruments.</p>';
    return;
  }

  container.innerHTML = items.map(({ instrument, status }) => `
    <div class="attention-item">
      <div>
        <strong>${escapeHTML(instrument.name)}</strong>
        <small>${escapeHTML(instrument.id)} · ${formatDate(
          getNextDueDate(instrument)
        )}</small>
      </div>
      <span class="status-badge ${status.className}">
        ${status.label}
      </span>
    </div>
  `).join("");
}

let statusChart = null;

function renderChart(counts) {
  const canvas = $("statusChart");

  if (typeof Chart === "undefined") {
    return;
  }

  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Valid", "Due Soon", "Overdue"],
      datasets: [{
        data: [counts.valid, counts.due, counts.overdue],
        backgroundColor: ["#16845b", "#e2a338", "#df5c62"],
        borderWidth: 0,
        hoverOffset: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { usePointStyle: true, padding: 20 }
        }
      }
    }
  });
}

// Modal controls

function openModal(instrument = null) {
  form.reset();
  formError.textContent = "";
  $("editingId").value = instrument ? instrument.id : "";

  $("modalTitle").textContent = instrument
    ? "Edit Instrument"
    : "Add Instrument";

  $("assetId").value = instrument ? instrument.id : "";
  $("assetId").readOnly = Boolean(instrument);

  $("instrumentName").value = instrument?.name || "";
  $("instrumentType").value = instrument?.type || "";
  $("manufacturer").value = instrument?.manufacturer || "";
  $("serialNumber").value = instrument?.serialNumber || "";
  $("instrumentLocation").value = instrument?.location || "";
  $("lastCalibration").value = instrument?.lastCalibration || dateOffset(0);
  $("intervalDays").value = instrument?.intervalDays ?? 365;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  $("instrumentName").focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  formError.textContent = "";
  $("assetId").readOnly = false;
  $("addInstrumentBtn").focus();
}

$("addInstrumentBtn").addEventListener("click", () => openModal());
$("closeModalBtn").addEventListener("click", closeModal);
$("cancelModalBtn").addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});

// Add or edit a record

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";

  const editingId = $("editingId").value;
  const id = $("assetId").value.trim().toUpperCase();
  const name = $("instrumentName").value.trim();
  const type = $("instrumentType").value;
  const manufacturer = $("manufacturer").value.trim();
  const serialNumber = $("serialNumber").value.trim();
  const location = $("instrumentLocation").value.trim();
  const lastCalibration = $("lastCalibration").value;
  const intervalDays = Number($("intervalDays").value);

  if (!id || !name || !type || !location || !lastCalibration) {
    formError.textContent = "Please complete all required fields.";
    return;
  }

  if (!/^[A-Z0-9_-]+$/.test(id)) {
    formError.textContent =
      "Asset ID may contain only letters, numbers, hyphens, and underscores.";
    return;
  }

  if (
    !Number.isInteger(intervalDays) ||
    intervalDays < 1 ||
    intervalDays > 3650
  ) {
    formError.textContent =
      "Calibration interval must be between 1 and 3650 whole days.";
    return;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (new Date(`${lastCalibration}T12:00:00`) > today) {
    formError.textContent =
      "Last calibration date cannot be in the future.";
    return;
  }

  const duplicate = instruments.some((instrument) =>
    instrument.id.toUpperCase() === id &&
    instrument.id !== editingId
  );

  if (duplicate) {
    formError.textContent = "This Asset ID already exists.";
    return;
  }

  const record = {
    id, name, type, manufacturer, serialNumber,
    location, lastCalibration, intervalDays
  };

  if (editingId) {
  instruments = instruments.map((instrument) =>
    instrument.id === editingId ? record : instrument
  );
} else {
  instruments.push(record);
}

saveInstruments();

  closeModal();
  applySearch();
  renderDashboard();
});

// Search

function applySearch() {
  const query = $("searchInput").value.trim().toLowerCase();

  const filtered = instruments
    .filter((instrument) => [
      instrument.id,
      instrument.name,
      instrument.location,
      instrument.type,
      instrument.manufacturer
    ].some(value => value.toLowerCase().includes(query)))
    .map(instrument => ({
      instrument,
      status: getInstrumentStatus(instrument)
    }));

  renderTable(filtered);
}

$("searchInput").addEventListener("input", applySearch);

// Edit and delete using event delegation

$("instrumentTableBody").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const instrument = instruments.find(item => item.id === id);

  if (!instrument) return;

  if (action === "edit") {
    openModal(instrument);
  }

  
if (action === "delete") {
  // Preserve instruments that have calibration history.
  const hasCalibrationHistory = calibrationHistory.some(
    (record) => record.assetId === id
  );

  if (hasCalibrationHistory) {
    alert(
      `Cannot delete ${instrument.id} because calibration history exists. ` +
      "Keep this instrument to preserve calibration traceability."
    );
    return;
  }

  const confirmed = window.confirm(
    `Delete instrument ${instrument.id} - ${instrument.name}?`
  );

  if (!confirmed) return;

  instruments = instruments.filter(
    (item) => item.id !== id
  );

  saveInstruments();
  applySearch();
  renderDashboard();
}

});

// Initial dashboard




/* =================================
   EXPORT INSTRUMENTS TO CSV
================================= */

function exportInstrumentsToCSV() {
  if (instruments.length === 0) {
    alert("No instruments available to export.");
    return;
  }

  const headers = [
    "Asset ID",
    "Instrument Name",
    "Type",
    "Manufacturer",
    "Serial Number",
    "Location",
    "Last Calibration",
    "Calibration Interval (Days)",
    "Next Due Date",
    "Status"
  ];

  const rows = instruments.map((instrument) => {
    const status = getInstrumentStatus(instrument);

    return [
      instrument.id,
      instrument.name,
      instrument.type,
      instrument.manufacturer,
      instrument.serialNumber,
      instrument.location,
      instrument.lastCalibration,
      instrument.intervalDays,
      getNextDueDate(instrument),
      status.label
    ];
  });

  // Escape commas, quotation marks, and line breaks.
  function escapeCSV(value) {
    let text = String(value ?? "");

    // Reduce spreadsheet formula-injection risk for text fields.
    if (/^[\t\r ]*[=+\-@]/.test(text)) {
      text = "'" + text;
    }

    return `"${text.replace(/"/g, '""')}"`;
  }

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map(row => row.map(escapeCSV).join(","))
  ].join("\r\n");

  // Include a UTF-8 BOM for better compatibility with Excel.
  const blob = new Blob(
    ["\uFEFF" + csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "CalibraTrack_Instrument_Inventory.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

const exportCsvBtn = document.getElementById("exportCsvBtn");

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", exportInstrumentsToCSV);
}


/* =========================================
   STEP 3: CALIBRATION HISTORY
========================================= */

const CALIBRATION_STORAGE_KEY = "calibraTrackCalibrationHistory";

let calibrationHistory = [];

// 1. Load saved calibration records
function loadCalibrationHistory() {
  try {
    const savedData = localStorage.getItem(CALIBRATION_STORAGE_KEY);

    if (savedData !== null) {
      const parsedData = JSON.parse(savedData);

      if (Array.isArray(parsedData)) {
        calibrationHistory = parsedData;
      }
    }
  } catch (error) {
    console.error("Unable to load calibration history:", error);
  }
}

// 2. Save calibration records
function saveCalibrationHistory() {
  try {
    localStorage.setItem(
      CALIBRATION_STORAGE_KEY,
      JSON.stringify(calibrationHistory)
    );
    return true;
  } catch (error) {
    console.error("Unable to save calibration history:", error);
    alert("Unable to save calibration history in this browser.");
    return false;
  }
}

// 3. Display records in the HTML table
function renderCalibrationHistory() {
  const tbody = $("calibrationHistoryBody");

  if (!tbody) return;

  if (calibrationHistory.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">No calibration history recorded yet.</td>
      </tr>
    `;
    return;
  }

  const sortedRecords = [...calibrationHistory].sort((a, b) =>
    b.calibrationDate.localeCompare(a.calibrationDate)
  );

  tbody.innerHTML = sortedRecords.map((record) => {
    let resultClass = "status-due";

    if (record.result === "Pass") {
      resultClass = "status-valid";
    } else if (record.result === "Fail") {
      resultClass = "status-overdue";
    }

    return `
      <tr>
        <td><strong>${escapeHTML(record.assetId)}</strong></td>
        <td>${escapeHTML(record.instrumentName)}</td>
        <td>${formatDate(record.calibrationDate)}</td>
        <td>
          <span class="status-badge ${resultClass}">
            ${escapeHTML(record.result)}
          </span>
        </td>
        <td>${escapeHTML(record.technician)}</td>
        <td>${escapeHTML(record.observations || "—")}</td>
      </tr>
    `;
  }).join("");
}

// 4. Create the Add Calibration modal
function createCalibrationModal() {
  if ($("calibrationModal")) return;

  const modalHTML = `
    <div id="calibrationModal" class="modal" aria-hidden="true">

      <div class="modal-backdrop"
           data-close-calibration-modal></div>

      <section class="modal-content"
               role="dialog"
               aria-modal="true"
               aria-labelledby="calibrationModalTitle">

        <div class="modal-header">
          <div>
            <p class="eyebrow">CALIBRATION RECORD</p>
            <h2 id="calibrationModalTitle">Add Calibration</h2>
            <p>Record an instrument calibration result.</p>
          </div>

          <button type="button"
                  id="closeCalibrationModalBtn"
                  class="close-btn"
                  aria-label="Close form">
            &times;
          </button>
        </div>

        <form id="calibrationForm">

          <div class="form-grid">

            <label>
              Instrument *
              <select id="calibrationInstrument" required>
                <option value="">Select instrument</option>
              </select>
            </label>

            <label>
              Calibration Date *
              <input type="date"
                     id="calibrationDate"
                     required>
            </label>

            <label>
              Calibration Result *
              <select id="calibrationResult" required>
                <option value="">Select result</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Conditional">Conditional</option>
              </select>
            </label>

            <label>
              Technician *
              <input type="text"
                     id="calibrationTechnician"
                     maxlength="100"
                     placeholder="Technician name"
                     required>
            </label>

            <label class="full-width">
              Observations
              <textarea id="calibrationObservations"
                        rows="3"
                        maxlength="500"
                        placeholder="Enter findings or remarks"></textarea>
            </label>

          </div>

          <p id="calibrationFormError"
             class="form-error"
             role="alert"></p>

          <div class="form-actions">
            <button type="button"
                    id="cancelCalibrationModalBtn"
                    class="secondary-btn">
              Cancel
            </button>

            <button type="submit" class="primary-btn">
              Save Calibration
            </button>
          </div>

        </form>
      </section>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const calibrationModal = $("calibrationModal");
  const calibrationForm = $("calibrationForm");

  // Populate the instrument dropdown
  function populateInstrumentDropdown() {
    const select = $("calibrationInstrument");

    select.innerHTML = `
      <option value="">Select instrument</option>
      ${instruments.map((instrument) => `
        <option value="${escapeHTML(instrument.id)}">
          ${escapeHTML(instrument.id)} — ${escapeHTML(instrument.name)}
        </option>
      `).join("")}
    `;
  }

  // Open the modal
  function openCalibrationModal() {
    calibrationForm.reset();
    $("calibrationFormError").textContent = "";

    populateInstrumentDropdown();

    $("calibrationDate").value = toDateInputValue(new Date());
    $("calibrationDate").max = toDateInputValue(new Date());

    if (instruments.length === 0) {
      $("calibrationFormError").textContent =
        "Please add an instrument before recording calibration.";
    }

    calibrationModal.classList.add("is-open");
    calibrationModal.setAttribute("aria-hidden", "false");
    $("calibrationInstrument").focus();
  }

  // Close the modal
  function closeCalibrationModal() {
    calibrationModal.classList.remove("is-open");
    calibrationModal.setAttribute("aria-hidden", "true");
    $("calibrationFormError").textContent = "";

    $("addCalibrationBtn").focus();
  }

  // Button events
  $("addCalibrationBtn").addEventListener(
    "click",
    openCalibrationModal
  );

  $("closeCalibrationModalBtn").addEventListener(
    "click",
    closeCalibrationModal
  );

  $("cancelCalibrationModalBtn").addEventListener(
    "click",
    closeCalibrationModal
  );

  calibrationModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-calibration-modal]")) {
      closeCalibrationModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      calibrationModal.classList.contains("is-open")
    ) {
      closeCalibrationModal();
    }
  });

  // 5. Validate and save a new calibration
  calibrationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const errorElement = $("calibrationFormError");
    errorElement.textContent = "";

    const assetId = $("calibrationInstrument").value;
    const calibrationDate = $("calibrationDate").value;
    const result = $("calibrationResult").value;
    const technician = $("calibrationTechnician").value.trim();
    const observations = $("calibrationObservations").value.trim();

    const instrument = instruments.find(
      (item) => item.id === assetId
    );

    if (!instrument || !calibrationDate || !result || !technician) {
      errorElement.textContent =
        "Please complete all required fields.";
      return;
    }

    if (!["Pass", "Fail", "Conditional"].includes(result)) {
      errorElement.textContent = "Please select a valid result.";
      return;
    }

    if (calibrationDate > toDateInputValue(new Date())) {
      errorElement.textContent =
        "Calibration date cannot be in the future.";
      return;
    }

    const record = {
      recordId: `HIST-${Date.now()}-${Math.random()
        .toString(16).slice(2, 8)}`,
      assetId: instrument.id,
      instrumentName: instrument.name,
      calibrationDate,
      result,
      technician,
      observations
    };

    
calibrationHistory.push(record);

if (!saveCalibrationHistory()) {
  calibrationHistory.pop();
  return;
}

// Update the instrument's calibration date only after a Pass result.
if (result === "Pass") {
  instrument.lastCalibration = calibrationDate;
  saveInstruments();
}

// Refresh the dashboard and apply the current search filter.
renderDashboard();
applySearch();

// Refresh calibration history.
renderCalibrationHistory();

// Close the modal.
closeCalibrationModal();

  });
}

// 6. Initialize calibration history
loadCalibrationHistory();
createCalibrationModal();
renderCalibrationHistory();
renderDashboard();