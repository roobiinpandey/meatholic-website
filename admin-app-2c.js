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
