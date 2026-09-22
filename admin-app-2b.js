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
