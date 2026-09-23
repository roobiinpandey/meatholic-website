let sb = null, allRes = [], searchTimer = null;

function initSb() {
  if (!window.supabase) return false;
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

async function checkSession() {
  if (!initSb()) return;
  const { data: { session } } = await sb.auth.getSession();
  if (session) showDashboard(session.user);
}

document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!initSb()) return;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const err = document.getElementById("login-error");
  err.style.display = "none";
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { err.textContent = error.message; err.style.display = "block"; return; }
  showDashboard(data.user);
});

async function logout() { await sb.auth.signOut(); location.reload(); }

function showDashboard(user) {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("admin-email").textContent = user.email;
  document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-AE", {
    timeZone: "Asia/Dubai",
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  // Default: current service day (rolls over at 2:00 AM Dubai)
  const fd = document.getElementById("filter-date");
  if (fd) fd.value = getServiceDate();
  loadReservations();
}

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  const el = document.getElementById("view-" + name);
  if (el) el.style.display = "block";
  document.querySelectorAll(".nav-item[data-view]").forEach(n => n.classList.toggle("active", n.dataset.view === name));
  if (name === "reservations") loadReservations();
  if (name === "menu") loadDishes();
  if (name === "gallery") loadGallery();
  if (name === "specials") loadSpecials();
  if (name === "settings") loadSettings();
}

function esc(t) { const d = document.createElement("div"); d.textContent = t || ""; return d.innerHTML; }
function fmtDate(iso) { return iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }) : "—"; }

function openModal(html) {
  document.getElementById("modal-inner").innerHTML = html;
  document.getElementById("modal").classList.add("show");
}
function closeModal() { document.getElementById("modal").classList.remove("show"); }
document.getElementById("modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });

/** Service day in Asia/Dubai: new cycle starts at 02:00 (shift ends 2 AM). */
function getServiceDate(d) {
  const now = d ? new Date(d) : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(now);
  const get = (t) => parts.find(p => p.type === t)?.value;
  let y = +get("year"), m = +get("month"), day = +get("day");
  const hour = parseInt(get("hour"), 10);
  // Before 2:00 AM → still previous service day
  if (hour < 2) {
    const prev = new Date(Date.UTC(y, m - 1, day));
    prev.setUTCDate(prev.getUTCDate() - 1);
    y = prev.getUTCFullYear();
    m = prev.getUTCMonth() + 1;
    day = prev.getUTCDate();
  }
  return y + "-" + String(m).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

async function loadReservations() {
  const loading = document.getElementById("res-loading");
  const table = document.getElementById("res-table");
  const empty = document.getElementById("res-empty");
  if (loading) loading.style.display = "block";
  if (table) table.style.display = "none";
  if (empty) empty.style.display = "none";
  // Latest first: newest created, then later booking time
  let q = sb.from("reservations").select("*")
    .order("created_at", { ascending: false })
    .order("reservation_time", { ascending: false });
  const df = document.getElementById("filter-date")?.value;
  const sf = document.getElementById("filter-status")?.value;
  // Specific date = that day's bookings only. Empty = all dates.
  if (df) q = q.eq("reservation_date", df);
  if (sf) q = q.eq("status", sf);
  const { data, error } = await q;
  if (loading) loading.style.display = "none";
  if (error) { alert(error.message); return; }
  allRes = data || [];
  renderRes();
  updateStats();
}

function debounceSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(renderRes, 250); }

function renderRes() {
  const search = (document.getElementById("filter-search")?.value || "").toLowerCase();
  let list = allRes;
  if (search) list = list.filter(r => (r.guest_name || "").toLowerCase().includes(search) || (r.phone || "").includes(search));
  const tbody = document.getElementById("reservations-body");
  const empty = document.getElementById("res-empty");
  const table = document.getElementById("res-table");
  if (!list.length) { tbody.innerHTML = ""; table.style.display = "none"; empty.style.display = "block"; return; }
  empty.style.display = "none"; table.style.display = "table";
  tbody.innerHTML = list.map(r => {
    const dig = (r.phone || "").replace(/\D/g, "");
    const wa = dig ? `https://wa.me/${dig.startsWith("971") ? dig : "971" + dig.replace(/^0/, "")}?text=${encodeURIComponent("Hello " + r.guest_name + ", re your Meatholic reservation…")}` : "#";
    return `<tr>
      <td><strong>${fmtDate(r.reservation_date)}</strong><br><span style="color:var(--muted);font-size:0.8rem">${(r.reservation_time || "").slice(0, 5)}</span></td>
      <td>${esc(r.guest_name)}</td>
      <td><a href="tel:${r.phone}" style="color:var(--accent-light)">${esc(r.phone)}</a></td>
      <td>${r.party_size}</td>
      <td><span class="status ${r.status}">${r.status}</span></td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.notes || "—")}</td>
      <td><div class="actions">
        <button onclick="editRes('${r.id}')">Edit</button>
        <button onclick="setResStatus('${r.id}','confirmed')">✓</button>
        <button onclick="setResStatus('${r.id}','cancelled')">✕</button>
        <a href="${wa}" target="_blank">WA</a>
      </div></td>
    </tr>`;
  }).join("");
}

function updateStats() {
  const serviceDay = getServiceDate();
  const df = document.getElementById("filter-date")?.value;
  // Stats for selected day, or service day when viewing all
  const day = df || serviceDay;
  const t = allRes.filter(r => r.reservation_date === day && !["cancelled", "no_show"].includes(r.status));
  document.getElementById("stat-today").textContent = t.length;
  document.getElementById("stat-pending").textContent = allRes.filter(r => r.status === "pending").length;
  document.getElementById("stat-confirmed").textContent = allRes.filter(r => r.status === "confirmed").length;
  document.getElementById("stat-covers").textContent = t.reduce((s, r) => s + (r.party_size || 0), 0);
}

function openResModal(r) {
  openModal(`<h3>${r ? "Edit" : "New"} Reservation</h3>
    <form onsubmit="saveRes(event)">
      <input type="hidden" id="m-id" value="${r?.id || ""}">
      <div class="form-group"><label>Guest Name *</label><input id="m-name" value="${esc(r?.guest_name || "")}" required></div>
      <div class="form-group"><label>Phone *</label><input id="m-phone" value="${esc(r?.phone || "")}" required></div>
      <div class="form-group"><label>Email</label><input id="m-email" type="email" value="${esc(r?.email || "")}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.7rem">
        <div class="form-group"><label>Date *</label><input type="date" id="m-date" value="${r?.reservation_date || getServiceDate()}" required></div>
        <div class="form-group"><label>Time *</label><input type="time" id="m-time" value="${(r?.reservation_time || "19:00").slice(0,5)}" required></div>
      </div>
      <div class="form-group"><label>Party Size *</label><input type="number" id="m-party" min="1" max="30" value="${r?.party_size || 2}" required></div>
      <div class="form-group"><label>Status</label>
        <select id="m-status">${["pending","confirmed","cancelled","completed","no_show"].map(s => `<option value="${s}" ${r?.status===s?"selected":""}>${s}</option>`).join("")}</select>
      </div>
      <div class="form-group"><label>Source</label>
        <select id="m-source">${["admin","website","phone","whatsapp"].map(s => `<option value="${s}" ${r?.source===s?"selected":""}>${s}</option>`).join("")}</select>
      </div>
      <div class="form-group"><label>Notes</label><textarea id="m-notes">${esc(r?.notes || "")}</textarea></div>
      <div class="form-group"><label>Internal Notes</label><textarea id="m-internal">${esc(r?.internal_notes || "")}</textarea></div>
      <div class="modal-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button type="submit" class="btn">Save</button></div>
    </form>`);
}

function editRes(id) { const r = allRes.find(x => x.id === id); if (r) openResModal(r); }

async function saveRes(e) {
  e.preventDefault();
  const id = document.getElementById("m-id").value;
  const payload = {
    guest_name: document.getElementById("m-name").value.trim(),
    phone: document.getElementById("m-phone").value.trim(),
    email: document.getElementById("m-email").value.trim() || null,
    reservation_date: document.getElementById("m-date").value,
    reservation_time: document.getElementById("m-time").value,
    party_size: parseInt(document.getElementById("m-party").value, 10),
    status: document.getElementById("m-status").value,
    source: document.getElementById("m-source").value,
    notes: document.getElementById("m-notes").value.trim() || null,
    internal_notes: document.getElementById("m-internal").value.trim() || null
  };
  const { error } = id
    ? await sb.from("reservations").update(payload).eq("id", id)
    : await sb.from("reservations").insert([payload]);
  if (error) return alert(error.message);
  closeModal(); loadReservations();
}

async function setResStatus(id, status) {
  const { error } = await sb.from("reservations").update({ status }).eq("id", id);
  if (error) return alert(error.message);
  loadReservations();
}

function exportCSV() {
  if (!allRes.length) return alert("No data");
  const rows = [["Date","Time","Name","Phone","Party","Status","Notes"], ...allRes.map(r => [r.reservation_date, (r.reservation_time||"").slice(0,5), r.guest_name, r.phone, r.party_size, r.status, r.notes||""])];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `meatholic-reservations-${new Date().toISOString().slice(0,10)}.csv`; a.click();
}

function filterResToday() {
  const fd = document.getElementById("filter-date");
  if (fd) fd.value = getServiceDate(); // service day (until 2 AM Dubai)
  loadReservations();
}
function filterResAll() {
  const fd = document.getElementById("filter-date");
  if (fd) fd.value = "";
  loadReservations();
}
