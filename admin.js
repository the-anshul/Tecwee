(function initAdminDashboard() {
  const token = localStorage.getItem("tecweeToken");
  const user = readStoredUser();

  const state = {
    contacts: [],
    selectedId: null,
    dashboard: null,
  };

  const leadStatuses = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  const supportStatuses = ["open", "in_progress", "waiting", "resolved", "closed"];
  const priorities = ["low", "normal", "high", "urgent"];

  const els = {
    alert: document.getElementById("adminAlert"),
    adminEmail: document.getElementById("adminEmail"),
    subtitle: document.getElementById("adminSubtitle"),
    refresh: document.getElementById("refreshBtn"),
    logout: document.getElementById("logoutBtn"),
    search: document.getElementById("searchInput"),
    type: document.getElementById("typeFilter"),
    status: document.getElementById("statusFilter"),
    recordsBody: document.getElementById("recordsBody"),
    empty: document.getElementById("emptyState"),
    detail: document.getElementById("recordDetail"),
  };

  if (!token || !user || user.role !== "admin") {
    redirectToLogin();
    return;
  }

  els.adminEmail.textContent = user.email || "Admin";
  populateStatusFilter();
  bindEvents();
  loadAll();

  function readStoredUser() {
    try {
      return JSON.parse(localStorage.getItem("tecweeUser") || "null");
    } catch (error) {
      return null;
    }
  }

  function bindEvents() {
    els.logout.addEventListener("click", () => {
      localStorage.removeItem("tecweeToken");
      localStorage.removeItem("tecweeUser");
      window.location.href = "login.html";
    });

    els.refresh.addEventListener("click", loadAll);
    els.search.addEventListener("input", debounce(loadContacts, 240));
    els.type.addEventListener("change", () => {
      populateStatusFilter();
      loadContacts();
    });
    els.status.addEventListener("change", loadContacts);
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("tecweeToken");
      localStorage.removeItem("tecweeUser");
      redirectToLogin();
      throw new Error(data.error || "Admin access required");
    }
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function loadAll() {
    setBusy(true);
    hideAlert();
    try {
      const dashboard = await api("/api/admin/dashboard");
      state.dashboard = dashboard;
      renderDashboard(dashboard);
      await loadContacts();
      els.subtitle.textContent = `Signed in as ${user.email}`;
    } catch (error) {
      showAlert(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadContacts() {
    const params = new URLSearchParams({ limit: "75" });
    if (els.type.value) params.set("recordType", els.type.value);
    if (els.status.value) params.set("status", els.status.value);
    if (els.search.value.trim()) params.set("search", els.search.value.trim());

    try {
      const data = await api(`/api/admin/contacts?${params.toString()}`);
      state.contacts = data.contacts || [];
      if (!state.contacts.some((contact) => contact.id === state.selectedId)) {
        state.selectedId = state.contacts[0] ? state.contacts[0].id : null;
      }
      renderRecords();
      renderDetail();
    } catch (error) {
      showAlert(error.message);
    }
  }

  function renderDashboard(data) {
    setText("kpiTotal", data.kpis.totalRecords);
    setText("kpiNew", data.kpis.newLeads);
    setText("kpiSupport", data.kpis.openSupport);
    setText("kpiWon", data.kpis.wonLeads);
    setText("kpiStale", data.kpis.staleFollowUps);

    renderBars("leadFunnel", data.funnel || []);
    renderTrend(data.dailyTrend || []);
    renderCompactList("subjectBreakdown", data.subjectBreakdown || [], "No subject data yet.");
    renderCompactList("staleList", (data.staleFollowUps || []).map((item) => ({
      label: `${item.firstName} ${item.lastName}`,
      count: item.status.replace(/_/g, " "),
    })), "No stale follow-ups.");
  }

  function renderBars(id, rows) {
    const root = document.getElementById(id);
    const max = Math.max(1, ...rows.map((row) => row.count));
    root.innerHTML = rows.map((row) => `
      <div class="bar-row">
        <div class="bar-meta"><span>${escapeHtml(row.label)}</span><strong>${row.count}</strong></div>
        <div class="bar-track"><span style="width:${Math.max(5, (row.count / max) * 100)}%"></span></div>
      </div>
    `).join("");
  }

  function renderTrend(rows) {
    const root = document.getElementById("dailyTrend");
    const max = Math.max(1, ...rows.map((row) => row.count));
    root.innerHTML = rows.map((row) => `
      <div class="trend-day">
        <span style="height:${Math.max(8, (row.count / max) * 92)}px"></span>
        <small>${new Date(`${row.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</small>
        <strong>${row.count}</strong>
      </div>
    `).join("");
  }

  function renderCompactList(id, rows, emptyText) {
    const root = document.getElementById(id);
    if (!rows.length) {
      root.innerHTML = `<div class="empty-state">${emptyText}</div>`;
      return;
    }

    root.innerHTML = rows.map((row) => `
      <div class="compact-row">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(String(row.count))}</strong>
      </div>
    `).join("");
  }

  function renderRecords() {
    els.empty.hidden = state.contacts.length > 0;
    els.recordsBody.innerHTML = state.contacts.map((contact) => `
      <tr class="${contact.id === state.selectedId ? "selected" : ""}" data-id="${contact.id}">
        <td>
          <button type="button" class="record-select" data-id="${contact.id}">
            <strong>${escapeHtml(contact.firstName)} ${escapeHtml(contact.lastName)}</strong>
            <span>${escapeHtml(contact.email)}</span>
          </button>
        </td>
        <td><span class="pill">${escapeHtml(contact.record_type)}</span></td>
        <td><span class="pill status-${escapeHtml(contact.status)}">${escapeHtml(contact.status.replace(/_/g, " "))}</span></td>
        <td><span class="pill priority-${escapeHtml(contact.priority)}">${escapeHtml(contact.priority)}</span></td>
        <td>${formatDate(contact.created_at)}</td>
      </tr>
    `).join("");

    els.recordsBody.querySelectorAll(".record-select").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedId = Number(button.dataset.id);
        renderRecords();
        renderDetail();
      });
    });
  }

  function renderDetail() {
    const contact = state.contacts.find((item) => item.id === state.selectedId);
    if (!contact) {
      els.detail.innerHTML = '<div class="empty-state">Select a record to view details.</div>';
      return;
    }

    const statusOptions = contact.record_type === "support" ? supportStatuses : leadStatuses;
    els.detail.innerHTML = `
      <div class="detail-head">
        <div>
          <h3>${escapeHtml(contact.firstName)} ${escapeHtml(contact.lastName)}</h3>
          <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>
        </div>
        <span class="pill priority-${escapeHtml(contact.priority)}">${escapeHtml(contact.priority)}</span>
      </div>
      <dl class="detail-meta">
        <div><dt>Subject</dt><dd>${escapeHtml(contact.subject || "No subject")}</dd></div>
        <div><dt>Created</dt><dd>${formatDate(contact.created_at)}</dd></div>
      </dl>
      <p class="detail-message">${escapeHtml(contact.message)}</p>
      <form class="detail-form" id="detailForm">
        <label>Type
          <select name="record_type">${optionList(["lead", "support"], contact.record_type)}</select>
        </label>
        <label>Status
          <select name="status">${optionList(statusOptions, contact.status)}</select>
        </label>
        <label>Priority
          <select name="priority">${optionList(priorities, contact.priority)}</select>
        </label>
        <label>Notes
          <textarea name="notes" rows="5" placeholder="Next action, context, owner notes...">${escapeHtml(contact.notes)}</textarea>
        </label>
        <div class="detail-actions">
          <button class="btn btn-primary" type="submit">Save changes</button>
          <button class="btn btn-secondary" id="markContacted" type="button">Mark contacted</button>
        </div>
      </form>
    `;

    const form = document.getElementById("detailForm");
    form.elements.record_type.addEventListener("change", () => {
      const nextStatuses = form.elements.record_type.value === "support" ? supportStatuses : leadStatuses;
      form.elements.status.innerHTML = optionList(nextStatuses, nextStatuses[0]);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      updateContact(contact.id, {
        record_type: form.elements.record_type.value,
        status: form.elements.status.value,
        priority: form.elements.priority.value,
        notes: form.elements.notes.value,
      });
    });
    document.getElementById("markContacted").addEventListener("click", () => {
      updateContact(contact.id, { last_contacted_at: new Date().toISOString() });
    });
  }

  async function updateContact(id, patch) {
    setBusy(true);
    hideAlert();
    try {
      const data = await api(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const index = state.contacts.findIndex((contact) => contact.id === id);
      if (index >= 0) state.contacts[index] = data.contact;
      state.selectedId = data.contact.id;
      renderRecords();
      renderDetail();
      const dashboard = await api("/api/admin/dashboard");
      state.dashboard = dashboard;
      renderDashboard(dashboard);
    } catch (error) {
      showAlert(error.message);
    } finally {
      setBusy(false);
    }
  }

  function populateStatusFilter() {
    const statuses = els.type.value === "support" ? supportStatuses : els.type.value === "lead" ? leadStatuses : [...leadStatuses, ...supportStatuses];
    els.status.innerHTML = '<option value="">All statuses</option>' + statuses.map((status) => `<option value="${status}">${status.replace(/_/g, " ")}</option>`).join("");
  }

  function optionList(options, selected) {
    return options.map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${option.replace(/_/g, " ")}</option>`).join("");
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function setBusy(isBusy) {
    els.refresh.disabled = isBusy;
    els.refresh.textContent = isBusy ? "Loading..." : "Refresh";
  }

  function showAlert(message) {
    els.alert.textContent = message;
    els.alert.hidden = false;
  }

  function hideAlert() {
    els.alert.hidden = true;
    els.alert.textContent = "";
  }

  function redirectToLogin() {
    window.location.href = "login.html";
  }

  function formatDate(value) {
    if (!value) return "Not set";
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => fn(...args), delay);
    };
  }
})();
