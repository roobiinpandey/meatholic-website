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
  document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-AE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const fd = document.getElementById("filter-date");
  if (fd) fd.value = new Date().toISOString().slice(0, 10);
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

/* ========== RESERVATIONS ========== */
async function loadReservations() {
  const loading = document.getElementById("res-loading");
  const table = document.getElementById("res-table");
  const empty = document.getElementById("res-empty");
  if (loading) loading.style.display = "block";
  if (table) table.style.display = "none";
  if (empty) empty.style.display = "none";
  let q = sb.from("reservations").select("*").order("reservation_date", { ascending: false }).order("reservation_time");
  const df = document.getElementById("filter-date")?.value;
  const sf = document.getElementById("filter-status")?.value;
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
  const today = new Date().toISOString().slice(0, 10);
  const t = allRes.filter(r => r.reservation_date === today && !["cancelled", "no_show"].includes(r.status));
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
        <div class="form-group"><label>Date *</label><input type="date" id="m-date" value="${r?.reservation_date || new Date().toISOString().slice(0,10)}" required></div>
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

/* ========== DISHES / MENU ========== */
let allDishes = [];

async function loadDishes() {
  const { data, error } = await sb.from("dishes").select("*").order("sort_order");
  if (error) { alert(error.message); return; }
  allDishes = data || [];
  const grid = document.getElementById("dishes-grid");
  const empty = document.getElementById("dishes-empty");
  if (!allDishes.length) { grid.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  grid.innerHTML = allDishes.map(d => `
    <div class="item-card ${d.is_active ? "" : "inactive"}">
      ${d.image_url ? `<img src="${esc(d.image_url)}" alt="">` : `<div style="height:160px;background:#111;display:flex;align-items:center;justify-content:center;color:#555">No image</div>`}
      <div class="body">
        <h3>${esc(d.name)}</h3>
        <p>${esc(d.description || "")}</p>
        ${d.price ? `<div class="price">${esc(d.price)}</div>` : ""}
        <div class="card-actions">
          <button class="btn btn-sm" onclick="editDish('${d.id}')">Edit</button>
          <button class="btn btn-sm btn-outline" onclick="toggleDish('${d.id}', ${!d.is_active})">${d.is_active ? "Hide" : "Show"}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDish('${d.id}')">Delete</button>
        </div>
      </div>
    </div>`).join("");
}

function openDishModal(d) {
  openModal(`<h3>${d ? "Edit" : "Add"} Dish</h3>
    <form onsubmit="saveDish(event)">
      <input type="hidden" id="d-id" value="${d?.id || ""}">
      <div class="form-group"><label>Name *</label><input id="d-name" value="${esc(d?.name || "")}" required></div>
      <div class="form-group"><label>Description</label><textarea id="d-desc">${esc(d?.description || "")}</textarea></div>
      <div class="form-group"><label>Price (e.g. 89 د.إ)</label><input id="d-price" value="${esc(d?.price || "")}"></div>
      <div class="form-group"><label>Image URL</label><input id="d-img" value="${esc(d?.image_url || "")}" placeholder="https://…"><div class="hint">Paste a direct image link (Imgur, Cloudinary, etc.)</div></div>
      <div class="form-group"><label>Category</label>
        <select id="d-cat">${["signature","sides","dessert","other"].map(c => `<option value="${c}" ${d?.category===c?"selected":""}>${c}</option>`).join("")}</select>
      </div>
      <div class="form-group"><label>Sort order</label><input type="number" id="d-sort" value="${d?.sort_order ?? 0}"></div>
      <div class="form-group"><label><input type="checkbox" id="d-active" ${d?.is_active !== false ? "checked" : ""}> Active (show on website)</label></div>
      <div class="modal-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button type="submit" class="btn">Save</button></div>
    </form>`);
}

function editDish(id) { const d = allDishes.find(x => x.id === id); if (d) openDishModal(d); }

async function saveDish(e) {
  e.preventDefault();
  const id = document.getElementById("d-id").value;
  const payload = {
    name: document.getElementById("d-name").value.trim(),
    description: document.getElementById("d-desc").value.trim() || null,
    price: document.getElementById("d-price").value.trim() || null,
    image_url: document.getElementById("d-img").value.trim() || null,
    category: document.getElementById("d-cat").value,
    sort_order: parseInt(document.getElementById("d-sort").value, 10) || 0,
    is_active: document.getElementById("d-active").checked
  };
  const { error } = id
    ? await sb.from("dishes").update(payload).eq("id", id)
    : await sb.from("dishes").insert([payload]);
  if (error) return alert(error.message);
  closeModal(); loadDishes();
}

async function toggleDish(id, active) {
  const { error } = await sb.from("dishes").update({ is_active: active }).eq("id", id);
  if (error) return alert(error.message);
  loadDishes();
}

async function deleteDish(id) {
  if (!confirm("Delete this dish?")) return;
  const { error } = await sb.from("dishes").delete().eq("id", id);
  if (error) return alert(error.message);
  loadDishes();
}

/* ========== GALLERY ========== */
let allGallery = [];

async function loadGallery() {
  const { data, error } = await sb.from("gallery").select("*").order("sort_order");
  if (error) { alert(error.message); return; }
  allGallery = data || [];
  const grid = document.getElementById("gallery-grid");
  const empty = document.getElementById("gallery-empty");
  if (!allGallery.length) { grid.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  grid.innerHTML = allGallery.map(g => `
    <div class="item-card ${g.is_active ? "" : "inactive"}">
      <img src="${esc(g.image_url)}" alt="${esc(g.alt_text || "")}">
      <div class="body">
        <p>${esc(g.alt_text || "Gallery image")}</p>
        <div class="card-actions">
          <button class="btn btn-sm" onclick="editGallery('${g.id}')">Edit</button>
          <button class="btn btn-sm btn-outline" onclick="toggleGallery('${g.id}', ${!g.is_active})">${g.is_active ? "Hide" : "Show"}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGallery('${g.id}')">Delete</button>
        </div>
      </div>
    </div>`).join("");
}

function openGalleryModal(g) {
  openModal(`<h3>${g ? "Edit" : "Add"} Gallery Image</h3>
    <form onsubmit="saveGallery(event)">
      <input type="hidden" id="g-id" value="${g?.id || ""}">
      <div class="form-group"><label>Image URL *</label><input id="g-img" value="${esc(g?.image_url || "")}" required placeholder="https://…"><div class="hint">Paste a direct image link</div></div>
      <div class="form-group"><label>Alt text / caption</label><input id="g-alt" value="${esc(g?.alt_text || "")}"></div>
      <div class="form-group"><label>Sort order</label><input type="number" id="g-sort" value="${g?.sort_order ?? 0}"></div>
      <div class="form-group"><label><input type="checkbox" id="g-active" ${g?.is_active !== false ? "checked" : ""}> Active</label></div>
      <div class="modal-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button type="submit" class="btn">Save</button></div>
    </form>`);
}

function editGallery(id) { const g = allGallery.find(x => x.id === id); if (g) openGalleryModal(g); }

async function saveGallery(e) {
  e.preventDefault();
  const id = document.getElementById("g-id").value;
  const payload = {
    image_url: document.getElementById("g-img").value.trim(),
    alt_text: document.getElementById("g-alt").value.trim() || null,
    sort_order: parseInt(document.getElementById("g-sort").value, 10) || 0,
    is_active: document.getElementById("g-active").checked
  };
  const { error } = id
    ? await sb.from("gallery").update(payload).eq("id", id)
    : await sb.from("gallery").insert([payload]);
  if (error) return alert(error.message);
  closeModal(); loadGallery();
}

async function toggleGallery(id, active) {
  const { error } = await sb.from("gallery").update({ is_active: active }).eq("id", id);
  if (error) return alert(error.message);
  loadGallery();
}

async function deleteGallery(id) {
  if (!confirm("Delete this image?")) return;
  const { error } = await sb.from("gallery").delete().eq("id", id);
  if (error) return alert(error.message);
  loadGallery();
}

/* ========== SPECIALS ========== */
let allSpecials = [];

async function loadSpecials() {
  const { data, error } = await sb.from("specials").select("*").order("sort_order");
  if (error) { alert(error.message); return; }
  allSpecials = data || [];
  const grid = document.getElementById("specials-grid");
  const empty = document.getElementById("specials-empty");
  if (!allSpecials.length) { grid.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  grid.innerHTML = allSpecials.map(s => `
    <div class="item-card ${s.is_active ? "" : "inactive"}">
      ${s.image_url ? `<img src="${esc(s.image_url)}" alt="">` : `<div style="height:160px;background:#111;display:flex;align-items:center;justify-content:center;color:#555">No image</div>`}
      <div class="body">
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description || "")}</p>
        ${s.price ? `<div class="price">${esc(s.price)}</div>` : ""}
        <div class="card-actions">
          <button class="btn btn-sm" onclick="editSpecial('${s.id}')">Edit</button>
          <button class="btn btn-sm btn-outline" onclick="toggleSpecial('${s.id}', ${!s.is_active})">${s.is_active ? "Hide" : "Show"}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSpecial('${s.id}')">Delete</button>
        </div>
      </div>
    </div>`).join("");
}

function openSpecialModal(s) {
  openModal(`<h3>${s ? "Edit" : "Add"} Special</h3>
    <form onsubmit="saveSpecial(event)">
      <input type="hidden" id="s-id" value="${s?.id || ""}">
      <div class="form-group"><label>Title *</label><input id="s-title" value="${esc(s?.title || "")}" required></div>
      <div class="form-group"><label>Description</label><textarea id="s-desc">${esc(s?.description || "")}</textarea></div>
      <div class="form-group"><label>Price</label><input id="s-price" value="${esc(s?.price || "")}" placeholder="199 د.إ"></div>
      <div class="form-group"><label>Image URL</label><input id="s-img" value="${esc(s?.image_url || "")}" placeholder="https://…"><div class="hint">Paste a direct image link</div></div>
      <div class="form-group"><label>Sort order</label><input type="number" id="s-sort" value="${s?.sort_order ?? 0}"></div>
      <div class="form-group"><label><input type="checkbox" id="s-active" ${s?.is_active !== false ? "checked" : ""}> Active</label></div>
      <div class="modal-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button type="submit" class="btn">Save</button></div>
    </form>`);
}

function editSpecial(id) { const s = allSpecials.find(x => x.id === id); if (s) openSpecialModal(s); }

async function saveSpecial(e) {
  e.preventDefault();
  const id = document.getElementById("s-id").value;
  const payload = {
    title: document.getElementById("s-title").value.trim(),
    description: document.getElementById("s-desc").value.trim() || null,
    price: document.getElementById("s-price").value.trim() || null,
    image_url: document.getElementById("s-img").value.trim() || null,
    sort_order: parseInt(document.getElementById("s-sort").value, 10) || 0,
    is_active: document.getElementById("s-active").checked
  };
  const { error } = id
    ? await sb.from("specials").update(payload).eq("id", id)
    : await sb.from("specials").insert([payload]);
  if (error) return alert(error.message);
  closeModal(); loadSpecials();
}

async function toggleSpecial(id, active) {
  const { error } = await sb.from("specials").update({ is_active: active }).eq("id", id);
  if (error) return alert(error.message);
  loadSpecials();
}

async function deleteSpecial(id) {
  if (!confirm("Delete this special?")) return;
  const { error } = await sb.from("specials").delete().eq("id", id);
  if (error) return alert(error.message);
  loadSpecials();
}

/* ========== SETTINGS ========== */
async function loadSettings() {
  const { data } = await sb.from("settings").select("*");
  if (!data) return;
  const rest = data.find(s => s.key === "restaurant")?.value || {};
  const cap = data.find(s => s.key === "capacity")?.value || {};
  document.getElementById("set-name").value = rest.name || "";
  document.getElementById("set-tagline").value = rest.tagline || "";
  document.getElementById("set-subtitle").value = rest.subtitle || "";
  document.getElementById("set-phone").value = rest.phone || "";
  document.getElementById("set-whatsapp").value = rest.whatsapp || "";
  document.getElementById("set-address").value = rest.address || "";
  document.getElementById("set-hours").value = rest.hours || "";
  document.getElementById("set-instagram").value = rest.instagram || "";
  document.getElementById("set-max-covers").value = cap.max_covers_per_slot || 40;
}

async function saveAllSettings() {
  const restaurant = {
    name: document.getElementById("set-name").value.trim(),
    tagline: document.getElementById("set-tagline").value.trim(),
    subtitle: document.getElementById("set-subtitle").value.trim(),
    phone: document.getElementById("set-phone").value.trim(),
    whatsapp: document.getElementById("set-whatsapp").value.trim(),
    address: document.getElementById("set-address").value.trim(),
    hours: document.getElementById("set-hours").value.trim(),
    instagram: document.getElementById("set-instagram").value.trim()
  };
  const capacity = {
    max_covers_per_slot: parseInt(document.getElementById("set-max-covers").value, 10) || 40,
    slot_minutes: 90, open_time: "14:00", close_time: "00:00"
  };
  const { error } = await sb.from("settings").upsert([
    { key: "restaurant", value: restaurant },
    { key: "capacity", value: capacity }
  ]);
  if (error) return alert(error.message);
  const msg = document.getElementById("settings-msg");
  msg.style.display = "block";
  setTimeout(() => msg.style.display = "none", 2000);
}

checkSession();
