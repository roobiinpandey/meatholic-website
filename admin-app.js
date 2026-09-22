let supabaseClient = null, allReservations = [], searchTimer = null, maxCovers = 40;

function initSupabase() {
  if (SUPABASE_URL.includes("YOUR_") || SUPABASE_ANON_KEY.includes("YOUR_")) {
    const err = document.getElementById("login-error");
    err.style.display = "block";
    err.textContent = "Set SUPABASE_URL and SUPABASE_ANON_KEY at the top of this file first.";
    return false;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

async function checkSession() {
  if (!initSupabase()) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) showDashboard(session.user);
}

document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!initSupabase()) return;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errEl = document.getElementById("login-error");
  errEl.style.display = "none";
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { errEl.textContent = error.message; errEl.style.display = "block"; return; }
  showDashboard(data.user);
});

async function logout() { await supabaseClient.auth.signOut(); location.reload(); }

function showDashboard(user) {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("admin-email").textContent = user.email;
  document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-AE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  document.getElementById("filter-date").value = new Date().toISOString().slice(0, 10);
  loadSettings();
  loadReservations();
}

async function loadReservations() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("res-table").style.display = "none";
  document.getElementById("empty-state").style.display = "none";
  let q = supabaseClient.from("reservations").select("*").order("reservation_date", { ascending: false }).order("reservation_time", { ascending: true });
  const df = document.getElementById("filter-date").value;
  const sf = document.getElementById("filter-status").value;
  if (df) q = q.eq("reservation_date", df);
  if (sf) q = q.eq("status", sf);
  const { data, error } = await q;
  document.getElementById("loading").style.display = "none";
  if (error) { alert("Error: " + error.message); return; }
  allReservations = data || [];
  renderTable();
  updateStats();
}

function debounceSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(renderTable, 250); }

function renderTable() {
  const search = document.getElementById("filter-search").value.toLowerCase();
  let list = allReservations;
  if (search) list = list.filter(r => (r.guest_name||"").toLowerCase().includes(search) || (r.phone||"").includes(search));
  const tbody = document.getElementById("reservations-body");
  const empty = document.getElementById("empty-state");
  const table = document.getElementById("res-table");
  if (!list.length) { tbody.innerHTML = ""; table.style.display = "none"; empty.style.display = "block"; return; }
  empty.style.display = "none"; table.style.display = "table";
  tbody.innerHTML = list.map(r => {
    const digits = (r.phone||"").replace(/\D/g,"");
    const waNum = digits.startsWith("971") ? digits : "971" + digits.replace(/^0/,"");
    const waLink = digits ? `https://wa.me/${waNum}?text=${encodeURIComponent("Hello "+r.guest_name+", regarding your Meatholic reservation on "+r.reservation_date+" at "+(r.reservation_time||"").slice(0,5)+"…")}` : "#";
    return `<tr>
      <td><strong>${formatDate(r.reservation_date)}</strong><br><span style="color:var(--muted);font-size:0.82rem">${(r.reservation_time||"").slice(0,5)}</span></td>
      <td>${esc(r.guest_name)}</td>
      <td><a href="tel:${r.phone}" style="color:var(--accent-light)">${esc(r.phone)}</a></td>
      <td>${r.party_size}</td>
      <td><span class="status ${r.status}">${r.status}</span></td>
      <td style="font-size:0.82rem;color:var(--muted)">${r.source||"—"}</td>
      <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(r.notes||"")}">${esc(r.notes||"—")}</td>
      <td><div class="actions">
        <button onclick="editReservation('${r.id}')">Edit</button>
        <button onclick="setStatus('${r.id}','confirmed')" title="Confirm">✓</button>
        <button onclick="setStatus('${r.id}','cancelled')" title="Cancel">✕</button>
        <a href="${waLink}" target="_blank" title="WhatsApp guest">WA</a>
      </div></td>
    </tr>`;
  }).join("");
}

function updateStats() {
  const today = new Date().toISOString().slice(0,10);
  const todayList = allReservations.filter(r => r.reservation_date === today && !["cancelled","no_show"].includes(r.status));
  document.getElementById("stat-today").textContent = todayList.length;
  document.getElementById("stat-pending").textContent = allReservations.filter(r => r.status === "pending").length;
  document.getElementById("stat-confirmed").textContent = allReservations.filter(r => r.status === "confirmed").length;
  document.getElementById("stat-covers").textContent = todayList.reduce((s,r) => s + (r.party_size||0), 0);
}

function formatDate(iso) { return iso ? new Date(iso+"T12:00:00").toLocaleDateString("en-AE",{day:"numeric",month:"short",year:"numeric"}) : "—"; }
function esc(t) { const d = document.createElement("div"); d.textContent = t||""; return d.innerHTML; }

function openAddModal() {
  document.getElementById("modal-title").textContent = "New Reservation";
  document.getElementById("edit-id").value = "";
  document.getElementById("reservation-form").reset();
  document.getElementById("res-date").value = new Date().toISOString().slice(0,10);
  document.getElementById("res-status").value = "pending";
  document.getElementById("res-source").value = "admin";
  document.getElementById("modal").classList.add("show");
}

async function editReservation(id) {
  const r = allReservations.find(x => x.id === id); if (!r) return;
  document.getElementById("modal-title").textContent = "Edit Reservation";
  document.getElementById("edit-id").value = r.id;
  document.getElementById("guest-name").value = r.guest_name||"";
  document.getElementById("guest-phone").value = r.phone||"";
  document.getElementById("guest-email").value = r.email||"";
  document.getElementById("res-date").value = r.reservation_date||"";
  document.getElementById("res-time").value = (r.reservation_time||"").slice(0,5);
  document.getElementById("party-size").value = r.party_size||2;
  document.getElementById("res-status").value = r.status||"pending";
  document.getElementById("res-source").value = r.source||"admin";
  document.getElementById("res-notes").value = r.notes||"";
  document.getElementById("res-internal").value = r.internal_notes||"";
  document.getElementById("modal").classList.add("show");
}

function closeModal() { document.getElementById("modal").classList.remove("show"); }

document.getElementById("reservation-form").addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("edit-id").value;
  const payload = {
    guest_name: document.getElementById("guest-name").value.trim(),
    phone: document.getElementById("guest-phone").value.trim(),
    email: document.getElementById("guest-email").value.trim() || null,
    reservation_date: document.getElementById("res-date").value,
    reservation_time: document.getElementById("res-time").value,
    party_size: parseInt(document.getElementById("party-size").value,10),
    status: document.getElementById("res-status").value,
    source: document.getElementById("res-source").value,
    notes: document.getElementById("res-notes").value.trim() || null,
    internal_notes: document.getElementById("res-internal").value.trim() || null
  };
  let error;
  if (id) ({ error } = await supabaseClient.from("reservations").update(payload).eq("id", id));
  else ({ error } = await supabaseClient.from("reservations").insert([payload]));
  if (error) return alert("Error: " + error.message);
  closeModal(); loadReservations();
});

async function setStatus(id, status) {
  const { error } = await supabaseClient.from("reservations").update({ status }).eq("id", id);
  if (error) return alert(error.message);
  loadReservations();
}

function exportCSV() {
  if (!allReservations.length) return alert("No data");
  const headers = ["Date","Time","Name","Phone","Email","Party","Status","Source","Notes"];
  const rows = allReservations.map(r => [r.reservation_date,(r.reservation_time||"").slice(0,5),r.guest_name,r.phone,r.email||"",r.party_size,r.status,r.source||"",r.notes||""]);
  const csv = [headers,...rows].map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = `meatholic-reservations-${new Date().toISOString().slice(0,10)}.csv`; a.click();
}

async function loadSettings() {
  const { data } = await supabaseClient.from("settings").select("*");
  if (!data) return;
  const cap = data.find(s => s.key === "capacity");
  if (cap?.value?.max_covers_per_slot) { maxCovers = cap.value.max_covers_per_slot; document.getElementById("setting-max-covers").value = maxCovers; }
  const rest = data.find(s => s.key === "restaurant");
  if (rest?.value?.whatsapp) document.getElementById("setting-whatsapp").value = rest.value.whatsapp;
}

async function saveSettings() {
  const max = parseInt(document.getElementById("setting-max-covers").value,10) || 40;
  const wa = document.getElementById("setting-whatsapp").value.trim();
  await supabaseClient.from("settings").upsert([
    { key: "capacity", value: { max_covers_per_slot: max, slot_minutes: 90, open_time: "14:00", close_time: "00:00" } },
    { key: "restaurant", value: { name: "Meatholic", phone: "+971501262191", whatsapp: wa } }
  ]);
  maxCovers = max;
  document.getElementById("settings-msg").style.display = "block";
  setTimeout(() => document.getElementById("settings-msg").style.display = "none", 2000);
}

function showView(name) {
  document.getElementById("view-reservations").style.display = name === "reservations" ? "block" : "none";
  document.getElementById("view-settings").style.display = name === "settings" ? "block" : "none";
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  if (event && event.currentTarget) event.currentTarget.classList.add("active");
}

document.getElementById("modal").addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(); });
checkSession();
