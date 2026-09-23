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
        <p style="font-size:0.75rem;color:var(--muted)">${esc(d.category || "")} · order ${d.sort_order ?? 0}${d.is_active ? "" : " · hidden"}</p>
        <div class="card-actions">
          <button class="btn btn-sm" onclick="editDish('${d.id}')">Edit</button>
          <button class="btn btn-sm btn-outline" onclick="toggleDish('${d.id}', ${!d.is_active})">${d.is_active ? "Hide" : "Show"}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDish('${d.id}')">Delete</button>
        </div>
      </div>
    </div>`).join("");
}

function openDishModal(d) {
  const cats = ["starters","burgers","main","steaks","add-on","signature","sides","dessert","other"];
  openModal(`<h3>${d ? "Edit" : "Add"} Dish</h3>
    <form onsubmit="saveDish(event)">
      <input type="hidden" id="d-id" value="${d?.id || ""}">
      <div class="form-group"><label>Name *</label><input id="d-name" value="${esc(d?.name || "")}" required></div>
      <div class="form-group"><label>Description</label><textarea id="d-desc">${esc(d?.description || "")}</textarea></div>
      <div class="form-group"><label>Price (e.g. 68 or 78 / 114)</label><input id="d-price" value="${esc(d?.price || "")}"></div>
      <div class="form-group"><label>Image URL</label><input id="d-img" value="${esc(d?.image_url || "")}" placeholder="https://…"><div class="hint">Paste a direct image link (Cloudinary, Imgur, etc.)</div></div>
      <div class="form-group"><label>Category (website section)</label>
        <select id="d-cat">${cats.map(c => `<option value="${c}" ${d?.category===c?"selected":""}>${c}</option>`).join("")}</select>
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
  if (!confirm("Delete this dish permanently?")) return;
  const { error } = await sb.from("dishes").delete().eq("id", id);
  if (error) return alert(error.message);
  loadDishes();
}
