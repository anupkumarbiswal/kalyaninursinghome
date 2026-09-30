/* ============================================================
   Kalyani Nursing Home — admin.js
   Full appointment management with localStorage persistence
   ============================================================ */

'use strict';

/* ── Constants ─────────────────────────────────────────────── */
const STORAGE_KEY  = 'knh_appointments';
const AUTH_KEY     = 'knh_admin_auth';
const ADMIN_USER   = 'admin';
const ADMIN_PASS   = 'kalyani123';
const ROWS_PER_PAGE = 10;

/* ── State ─────────────────────────────────────────────────── */
let appointments  = loadAppointments();
let currentView   = 'dashboard';
let filterStatus  = '';
let filterDept    = '';
let searchQuery   = '';
let currentPage   = 1;
let sortCol       = 'booked';
let sortDir       = 'desc';
let editingId     = null;   // ID of appointment being edited
let viewingId     = null;   // ID of appointment being viewed

const deptLabels = {
  general:       'General Medicine',
  gynaecology:   'Gynaecology & Maternity',
  surgery:       'Surgery',
  paediatrics:   'Paediatrics',
  physiotherapy: 'Physiotherapy',
  diagnostics:   'Lab & Diagnostics',
  emergency:     'Emergency',
  other:         'Other',
};

/* ════════════════════════════════════════════════════════════
   DATA LAYER
════════════════════════════════════════════════════════════ */
function loadAppointments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedData();
  } catch { return seedData(); }
}

function saveAppointments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

/** Seed some demo records so the admin panel isn't empty */
function seedData() {
  const today  = new Date().toISOString().split('T')[0];
  const yday   = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tmrw   = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const data = [
    { id: uid(), firstName:'Rajesh', lastName:'Panda',   phone:'9876543210', email:'', dept:'general',      date: today, message:'Fever and cough for 3 days',          status:'pending',   booked: dateStr(-0.3) },
    { id: uid(), firstName:'Sunita', lastName:'Mishra',  phone:'8765432109', email:'', dept:'gynaecology',  date: today, message:'Routine check-up — 7 months pregnant', status:'confirmed', booked: dateStr(-1)   },
    { id: uid(), firstName:'Prasanta',lastName:'Sahoo',  phone:'7654321098', email:'', dept:'diagnostics',  date: yday,  message:'Blood test and X-ray',                 status:'completed', booked: dateStr(-2)   },
    { id: uid(), firstName:'Anjali', lastName:'Nayak',   phone:'6543210987', email:'', dept:'paediatrics',  date: tmrw,  message:'Child vaccination',                     status:'confirmed', booked: dateStr(-0.5) },
    { id: uid(), firstName:'Suresh', lastName:'Behera',  phone:'9988776655', email:'', dept:'surgery',      date: tmrw,  message:'Follow-up after minor surgery',         status:'pending',   booked: dateStr(-1.5) },
    { id: uid(), firstName:'Mamata', lastName:'Das',     phone:'8877665544', email:'', dept:'physiotherapy',date: today, message:'Knee pain physiotherapy session',       status:'pending',   booked: dateStr(-0.2) },
    { id: uid(), firstName:'Rajan',  lastName:'Mohanty', phone:'7766554433', email:'', dept:'general',      date: yday,  message:'Blood pressure check',                  status:'cancelled', booked: dateStr(-3)   },
    { id: uid(), firstName:'Priya',  lastName:'Singh',   phone:'6655443322', email:'', dept:'emergency',    date: yday,  message:'High fever emergency',                  status:'completed', booked: dateStr(-2.5) },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function dateStr(daysAgo) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

/* ════════════════════════════════════════════════════════════
   AUTH
════════════════════════════════════════════════════════════ */
const loginPage   = document.getElementById('loginPage');
const adminShell  = document.getElementById('adminShell');
const loginForm   = document.getElementById('loginForm');
const loginError  = document.getElementById('loginError');
const togglePw    = document.getElementById('togglePw');
const adminPass   = document.getElementById('adminPass');
const logoutBtn   = document.getElementById('logoutBtn');

function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function showShell(user) {
  loginPage.style.display  = 'none';
  adminShell.classList.remove('hidden');
  document.getElementById('sidebarUser').textContent = user || 'Admin';
  startClock();
  refreshAll();
}

function showLogin() {
  adminShell.classList.add('hidden');
  loginPage.style.display = 'flex';
  sessionStorage.removeItem(AUTH_KEY);
}

// Auto-login if session exists
if (isLoggedIn()) {
  showShell(sessionStorage.getItem('knh_admin_user') || 'Admin');
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    loginError.classList.remove('show');
    sessionStorage.setItem(AUTH_KEY, 'true');
    sessionStorage.setItem('knh_admin_user', user);
    showShell(user);
  } else {
    loginError.classList.add('show');
    adminPass.value = '';
    adminPass.focus();
  }
});

logoutBtn.addEventListener('click', () => {
  showLogin();
  toast('Logged out successfully', 'success');
});

togglePw.addEventListener('click', () => {
  adminPass.type = adminPass.type === 'password' ? 'text' : 'password';
  togglePw.textContent = adminPass.type === 'password' ? '👁' : '🙈';
});

/* ════════════════════════════════════════════════════════════
   LIVE CLOCK
════════════════════════════════════════════════════════════ */
function startClock() {
  const el = document.getElementById('liveClock');
  const fmt = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  };
  fmt();
  setInterval(fmt, 1000);

  // Today's date in today panel
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', {
    weekday:'long', day:'numeric', month:'long', year:'numeric'
  });
}

/* ════════════════════════════════════════════════════════════
   SIDEBAR NAVIGATION
════════════════════════════════════════════════════════════ */
const hamburgerAdmin  = document.getElementById('hamburgerAdmin');
const sidebar         = document.getElementById('sidebar');
const sidebarOverlay  = document.getElementById('sidebarOverlay');

hamburgerAdmin.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('open');
});
sidebarOverlay.addEventListener('click', closeSidebar);
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

document.querySelectorAll('.sidebar-nav a[data-view]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
    closeSidebar();
  });
});

function switchView(view) {
  currentView = view;

  // Update sidebar active link
  document.querySelectorAll('.sidebar-nav a[data-view]').forEach(l => {
    l.classList.toggle('active', l.dataset.view === view);
  });

  // Show/hide view panels
  document.getElementById('view-dashboard').style.display    = view === 'dashboard'    ? 'block' : 'none';
  document.getElementById('view-appointments').style.display = view === 'appointments' ? 'block' : 'none';

  // Update topbar title
  const titles = { dashboard: '📊 Dashboard', appointments: '📅 Appointments' };
  document.getElementById('topbarTitle').textContent = titles[view] || 'Admin';

  if (view === 'appointments') renderAppointments();
  if (view === 'dashboard')    renderDashboard();
}

/* ════════════════════════════════════════════════════════════
   STATS / DASHBOARD
════════════════════════════════════════════════════════════ */
function getStats() {
  const today = new Date().toISOString().split('T')[0];
  const s = { total: appointments.length, pending:0, confirmed:0, completed:0, cancelled:0, today:0 };
  appointments.forEach(a => {
    s[a.status] = (s[a.status] || 0) + 1;
    if (a.date === today) s.today++;
  });
  return s;
}

function renderDashboard() {
  const s = getStats();
  document.getElementById('stat-total').textContent     = s.total;
  document.getElementById('stat-pending').textContent   = s.pending;
  document.getElementById('stat-confirmed').textContent = s.confirmed;
  document.getElementById('stat-completed').textContent = s.completed;
  document.getElementById('stat-cancelled').textContent = s.cancelled;
  document.getElementById('stat-today').textContent     = s.today;

  // Today chips
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === today);
  const ts = { pending:0, confirmed:0, completed:0, cancelled:0 };
  todayAppts.forEach(a => ts[a.status]++);
  document.getElementById('chip-pending').textContent   = ts.pending;
  document.getElementById('chip-confirmed').textContent = ts.confirmed;
  document.getElementById('chip-completed').textContent = ts.completed;
  document.getElementById('chip-cancelled').textContent = ts.cancelled;

  // Pending badge in sidebar
  document.getElementById('pendingBadge').textContent = s.pending;

  // Recent 10
  const recent = [...appointments]
    .sort((a,b) => new Date(b.booked) - new Date(a.booked))
    .slice(0, 10);

  const tbody = document.getElementById('recentTbody');
  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📭</div><p>No appointments yet</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(a => `
    <tr>
      <td>
        <div class="patient-name">${esc(a.firstName)} ${esc(a.lastName)}</div>
        <div class="patient-phone">${esc(a.phone)}</div>
      </td>
      <td>${deptLabels[a.dept] || a.dept}</td>
      <td>${a.date ? fmtDate(a.date) : '—'}</td>
      <td>${statusBadge(a.status)}</td>
      <td>
        <div class="action-btns">
          ${a.status === 'pending'   ? `<button class="btn-action btn-confirm"  onclick="changeStatus('${a.id}','confirmed')">✅ Confirm</button>` : ''}
          ${a.status === 'confirmed' ? `<button class="btn-action btn-complete" onclick="changeStatus('${a.id}','completed')">🏁 Done</button>` : ''}
          ${(a.status !== 'cancelled' && a.status !== 'completed') ? `<button class="btn-action btn-cancel" onclick="changeStatus('${a.id}','cancelled')">❌</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

/* ════════════════════════════════════════════════════════════
   APPOINTMENTS TABLE
════════════════════════════════════════════════════════════ */
const searchInput  = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const deptFilter   = document.getElementById('deptFilter');

searchInput.addEventListener('input',  () => { searchQuery = searchInput.value.toLowerCase(); currentPage = 1; renderAppointments(); });
statusFilter.addEventListener('change', () => { filterStatus = statusFilter.value; currentPage = 1; renderAppointments(); });
deptFilter.addEventListener('change',   () => { filterDept   = deptFilter.value;   currentPage = 1; renderAppointments(); });

// Sort on column header click
document.querySelectorAll('thead th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    if (sortCol === th.dataset.sort) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = th.dataset.sort;
      sortDir = 'asc';
    }
    renderAppointments();
  });
});

function getFiltered() {
  return appointments.filter(a => {
    const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
    const matchSearch = !searchQuery ||
      fullName.includes(searchQuery) ||
      a.phone.includes(searchQuery) ||
      (a.dept || '').toLowerCase().includes(searchQuery) ||
      (deptLabels[a.dept] || '').toLowerCase().includes(searchQuery);
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchDept   = !filterDept   || a.dept   === filterDept;
    return matchSearch && matchStatus && matchDept;
  });
}

function getSorted(list) {
  return [...list].sort((a, b) => {
    let va, vb;
    switch (sortCol) {
      case 'name':   va = `${a.firstName} ${a.lastName}`; vb = `${b.firstName} ${b.lastName}`; break;
      case 'phone':  va = a.phone;  vb = b.phone;  break;
      case 'dept':   va = a.dept;   vb = b.dept;   break;
      case 'date':   va = a.date;   vb = b.date;   break;
      case 'booked': va = a.booked; vb = b.booked; break;
      case 'status': va = a.status; vb = b.status; break;
      default:       va = a.id;     vb = b.id;
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });
}

function renderAppointments() {
  const filtered = getSorted(getFiltered());
  const total    = filtered.length;
  const pages    = Math.ceil(total / ROWS_PER_PAGE);
  if (currentPage > pages && pages > 0) currentPage = pages;

  const start   = (currentPage - 1) * ROWS_PER_PAGE;
  const pageData = filtered.slice(start, start + ROWS_PER_PAGE);

  document.getElementById('apptCount').textContent =
    `Showing ${pageData.length} of ${total} appointment${total !== 1 ? 's' : ''}`;

  const tbody = document.getElementById('apptTbody');

  if (!pageData.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🔍</div><p>No appointments found</p></div></td></tr>`;
    renderPagination(0, 0);
    return;
  }

  tbody.innerHTML = pageData.map((a, i) => `
    <tr>
      <td style="color:var(--a-text-light);font-size:.8rem;">${start + i + 1}</td>
      <td>
        <div class="patient-name">${esc(a.firstName)} ${esc(a.lastName)}</div>
        ${a.email ? `<div class="patient-phone">${esc(a.email)}</div>` : ''}
      </td>
      <td>${esc(a.phone)}</td>
      <td>${deptLabels[a.dept] || esc(a.dept) || '—'}</td>
      <td>${a.date ? fmtDate(a.date) : '—'}</td>
      <td style="font-size:.8rem;color:var(--a-text-light);">${fmtDateTime(a.booked)}</td>
      <td>${statusBadge(a.status)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-action btn-view"    onclick="viewAppt('${a.id}')">👁 View</button>
          <button class="btn-action btn-confirm" onclick="openEdit('${a.id}')">✏️ Edit</button>
          ${a.status === 'pending'   ? `<button class="btn-action btn-confirm"  onclick="changeStatus('${a.id}','confirmed')">✅</button>` : ''}
          ${a.status === 'confirmed' ? `<button class="btn-action btn-complete" onclick="changeStatus('${a.id}','completed')">🏁</button>` : ''}
          ${(a.status !== 'cancelled' && a.status !== 'completed') ? `<button class="btn-action btn-cancel" onclick="changeStatus('${a.id}','cancelled')">❌</button>` : ''}
          <button class="btn-action btn-delete"  onclick="deleteAppt('${a.id}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPagination(pages, currentPage);
}

function renderPagination(pages, current) {
  const container = document.getElementById('pagination');
  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  const start = Math.max(1, current - 2);
  const end   = Math.min(pages, start + 4);

  if (start > 1) html += `<button class="btn-page" onclick="goPage(1)">«</button>`;
  for (let p = start; p <= end; p++) {
    html += `<button class="btn-page ${p === current ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
  }
  if (end < pages) html += `<button class="btn-page" onclick="goPage(${pages})">»</button>`;

  container.innerHTML = html;
}

window.goPage = function(p) { currentPage = p; renderAppointments(); };

/* ════════════════════════════════════════════════════════════
   APPOINTMENT CRUD
════════════════════════════════════════════════════════════ */
window.changeStatus = function(id, newStatus) {
  const a = appointments.find(x => x.id === id);
  if (!a) return;
  a.status = newStatus;
  saveAppointments();
  refreshAll();
  toast(`Appointment marked as ${newStatus}`, 'success');
};

window.deleteAppt = function(id) {
  if (!confirm('Are you sure you want to delete this appointment? This cannot be undone.')) return;
  appointments = appointments.filter(x => x.id !== id);
  saveAppointments();
  refreshAll();
  toast('Appointment deleted', 'error');
};

/* ── Add / Edit Modal ── */
const apptModal   = document.getElementById('apptModal');
const apptForm    = document.getElementById('apptForm');
const modalTitle  = document.getElementById('modalTitle');
const btnAdd      = document.getElementById('btnAdd');
const modalClose  = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSave   = document.getElementById('modalSave');

btnAdd.addEventListener('click', () => openAdd());
modalClose.addEventListener('click',  closeModal);
modalCancel.addEventListener('click', closeModal);
apptModal.addEventListener('click', (e) => { if (e.target === apptModal) closeModal(); });

function openAdd() {
  editingId = null;
  modalTitle.textContent = '➕ Add Appointment';
  apptForm.reset();
  document.getElementById('apptId').value = '';
  // Set today as minimum date
  document.getElementById('mDate').min = new Date().toISOString().split('T')[0];
  apptModal.classList.add('open');
  document.getElementById('mFirstName').focus();
}

window.openEdit = function(id) {
  const a = appointments.find(x => x.id === id);
  if (!a) return;
  editingId = id;
  modalTitle.textContent = '✏️ Edit Appointment';
  document.getElementById('apptId').value = a.id;
  document.getElementById('mFirstName').value = a.firstName;
  document.getElementById('mLastName').value  = a.lastName;
  document.getElementById('mPhone').value     = a.phone;
  document.getElementById('mEmail').value     = a.email || '';
  document.getElementById('mDept').value      = a.dept;
  document.getElementById('mDate').value      = a.date || '';
  document.getElementById('mStatus').value    = a.status;
  document.getElementById('mMessage').value   = a.message || '';
  apptModal.classList.add('open');
};

function closeModal() {
  apptModal.classList.remove('open');
  editingId = null;
}

modalSave.addEventListener('click', () => {
  // Validate required fields
  const req = ['mFirstName', 'mLastName', 'mPhone', 'mDept'];
  let valid = true;
  req.forEach(id => {
    const el = document.getElementById(id);
    el.style.borderColor = '';
    if (!el.value.trim()) { valid = false; el.style.borderColor = '#e8734a'; }
  });
  if (!valid) { toast('Please fill in all required fields', 'warning'); return; }

  const appt = {
    id:        editingId || uid(),
    firstName: document.getElementById('mFirstName').value.trim(),
    lastName:  document.getElementById('mLastName').value.trim(),
    phone:     document.getElementById('mPhone').value.trim(),
    email:     document.getElementById('mEmail').value.trim(),
    dept:      document.getElementById('mDept').value,
    date:      document.getElementById('mDate').value,
    status:    document.getElementById('mStatus').value,
    message:   document.getElementById('mMessage').value.trim(),
    booked:    editingId
      ? appointments.find(x => x.id === editingId)?.booked || new Date().toISOString()
      : new Date().toISOString(),
  };

  if (editingId) {
    appointments = appointments.map(x => x.id === editingId ? appt : x);
    toast('Appointment updated successfully', 'success');
  } else {
    appointments.unshift(appt);
    toast('Appointment added successfully', 'success');
  }

  saveAppointments();
  closeModal();
  refreshAll();
});

/* ── View Detail Modal ── */
const viewModal       = document.getElementById('viewModal');
const viewModalClose  = document.getElementById('viewModalClose');
const viewModalCloseBtn = document.getElementById('viewModalCloseBtn');
const viewEditBtn     = document.getElementById('viewEditBtn');

viewModalClose.addEventListener('click',    closeViewModal);
viewModalCloseBtn.addEventListener('click', closeViewModal);
viewModal.addEventListener('click', (e) => { if (e.target === viewModal) closeViewModal(); });

viewEditBtn.addEventListener('click', () => {
  closeViewModal();
  if (viewingId) openEdit(viewingId);
});

function closeViewModal() {
  viewModal.classList.remove('open');
  viewingId = null;
}

window.viewAppt = function(id) {
  const a = appointments.find(x => x.id === id);
  if (!a) return;
  viewingId = id;

  document.getElementById('detailGrid').innerHTML = `
    <div class="detail-row"><span class="detail-label">Full Name</span><span class="detail-value">${esc(a.firstName)} ${esc(a.lastName)}</span></div>
    <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${esc(a.phone)}</span></div>
    <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${a.email ? esc(a.email) : '—'}</span></div>
    <div class="detail-row"><span class="detail-label">Department</span><span class="detail-value">${deptLabels[a.dept] || esc(a.dept)}</span></div>
    <div class="detail-row"><span class="detail-label">Preferred Date</span><span class="detail-value">${a.date ? fmtDate(a.date) : '—'}</span></div>
    <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${statusBadge(a.status)}</span></div>
    <div class="detail-row"><span class="detail-label">Booked On</span><span class="detail-value">${fmtDateTime(a.booked)}</span></div>
    <div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${a.message ? esc(a.message) : '—'}</span></div>
    <div class="detail-row"><span class="detail-label">Appt ID</span><span class="detail-value" style="font-size:.78rem;opacity:.6;">${a.id}</span></div>
  `;
  viewModal.classList.add('open');
};

/* ════════════════════════════════════════════════════════════
   CSV EXPORT
════════════════════════════════════════════════════════════ */
document.getElementById('btnExport').addEventListener('click', () => {
  const filtered = getSorted(getFiltered());
  if (!filtered.length) { toast('No data to export', 'warning'); return; }

  const headers = ['#','First Name','Last Name','Phone','Email','Department','Preferred Date','Status','Booked On','Notes'];
  const rows    = filtered.map((a, i) => [
    i + 1,
    a.firstName,
    a.lastName,
    a.phone,
    a.email || '',
    deptLabels[a.dept] || a.dept,
    a.date || '',
    a.status,
    fmtDateTime(a.booked),
    (a.message || '').replace(/,/g, ';'),
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  link.download = `KNH_Appointments_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast(`Exported ${filtered.length} record${filtered.length !== 1 ? 's' : ''}`, 'success');
});

/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
      day:'2-digit', month:'short', year:'numeric'
    });
  } catch { return iso; }
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day:'2-digit', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    });
  } catch { return iso; }
}

function statusBadge(s) {
  const map = {
    pending:   '⏳ Pending',
    confirmed: '✅ Confirmed',
    completed: '🏁 Completed',
    cancelled: '❌ Cancelled',
  };
  return `<span class="badge ${s}">${map[s] || s}</span>`;
}

function toast(msg, type = 'info') {
  const tc = document.getElementById('toastContainer');
  const t  = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function refreshAll() {
  if (currentView === 'dashboard')    renderDashboard();
  if (currentView === 'appointments') renderAppointments();
  // Always update pending badge
  const pending = appointments.filter(a => a.status === 'pending').length;
  document.getElementById('pendingBadge').textContent = pending;
}

/* ════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeViewModal(); }
});
