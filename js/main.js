// Always show top of page on refresh / first load
(function () {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  function goTop() { window.scrollTo(0, 0); }
  goTop();
  window.addEventListener("load", goTop);
  window.addEventListener("pageshow", function (e) { if (e.persisted) goTop(); });
})();

(function () {
  var links = document.querySelectorAll('.nav-links a[href^="#"]'), sections = [];
  links.forEach(function (link) {
    var id = link.getAttribute("href").slice(1), el = document.getElementById(id);
    if (el) sections.push({ id: id, el: el });
  });
  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
  }
  function onScroll() {
    var offset = 120, current = sections[0] && sections[0].id;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].el.getBoundingClientRect().top - offset <= 0) current = sections[i].id;
    }
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 80)
      current = sections[sections.length - 1] && sections[sections.length - 1].id;
    if (current) setActive(current);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", onScroll);
  onScroll();
  links.forEach(function (link) {
    link.addEventListener("click", function () {
      var id = link.getAttribute("href").slice(1);
      setTimeout(function () { setActive(id); }, 50);
    });
  });
  var logo = document.querySelector("header .logo");
  if (logo) {
    logo.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActive("");
      if (history.replaceState) history.replaceState(null, "", window.location.pathname);
    });
  }
})();

// —— Load menu / specials / gallery from Supabase (admin-controlled) ——
(function () {
  var SUPABASE_URL = "https://cjgybbaofhddmijbviyv.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_FPD8V7uI7g9gqSec7fL5Ug_yKqGeJg5";
  if (typeof supabase === "undefined") return;
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  var CAT_LABELS = {
    starters: "Starters & Salad",
    burgers: "Burgers",
    main: "Main",
    steaks: "Steaks",
    "add-on": "Add-On",
    addon: "Add-On",
    signature: "Signature",
    sides: "Sides",
    dessert: "Dessert",
    other: "Other"
  };
  var CAT_ORDER = ["starters", "burgers", "main", "steaks", "add-on", "addon", "signature", "sides", "dessert", "other"];

  function esc(t) {
    var d = document.createElement("div");
    d.textContent = t == null ? "" : String(t);
    return d.innerHTML;
  }

  function formatPrice(price) {
    if (price == null || price === "") return "";
    var s = String(price).trim();
    if (/[د\$€£]|AED|aed|dirham/i.test(s)) return esc(s);
    return '<i class="dirham-symbol" aria-label="UAE Dirham"></i> ' + esc(s);
  }

  function placeholderImg() {
    return "https://res.cloudinary.com/dzzonkdpm/image/upload/meatholic/exterior.jpg";
  }

  async function loadMenu() {
    var root = document.getElementById("menu-dynamic");
    if (!root) return;
    var res = await sb
      .from("dishes")
      .select("id,name,description,price,image_url,category,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (res.error) {
      console.error(res.error);
      root.innerHTML = '<p class="menu-note">Menu temporarily unavailable. Please call us.</p>';
      return;
    }
    var data = res.data;
    if (!data || !data.length) {
      root.innerHTML = '<p class="menu-note">Menu coming soon. Please ask our staff.</p>';
      return;
    }
    var byCat = {};
    data.forEach(function (d) {
      var c = (d.category || "other").toLowerCase();
      if (!byCat[c]) byCat[c] = [];
      byCat[c].push(d);
    });
    var keys = CAT_ORDER.filter(function (k) { return byCat[k] && byCat[k].length; });
    Object.keys(byCat).forEach(function (k) {
      if (keys.indexOf(k) === -1) keys.push(k);
    });
    root.innerHTML = keys.map(function (cat) {
      var label = CAT_LABELS[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
      var cards = byCat[cat].map(function (d) {
        var img = d.image_url || placeholderImg();
        return (
          '<div class="menu-card">' +
          '<img src="' + esc(img) + '" alt="' + esc(d.name) + '" loading="lazy">' +
          '<div class="body">' +
          '<div class="name">' + esc(d.name) + "</div>" +
          (d.description ? '<div class="desc">' + esc(d.description) + "</div>" : '<div class="desc"></div>') +
          (d.price ? '<div class="price">' + formatPrice(d.price) + "</div>" : "") +
          "</div></div>"
        );
      }).join("");
      return '<div class="menu-cat"><h3>' + esc(label) + '</h3><div class="menu-grid">' + cards + "</div></div>";
    }).join("");
  }

  async function loadSpecials() {
    var root = document.getElementById("specials-dynamic");
    if (!root) return;
    var res = await sb
      .from("specials")
      .select("id,title,description,price,image_url,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (res.error) {
      console.error(res.error);
      root.innerHTML = "";
      return;
    }
    var data = res.data;
    if (!data || !data.length) {
      root.innerHTML = '<p class="menu-note" style="grid-column:1/-1">No specials right now.</p>';
      return;
    }
    root.innerHTML = data.map(function (s) {
      var img = s.image_url || placeholderImg();
      return (
        '<div class="special-card">' +
        '<img src="' + esc(img) + '" alt="' + esc(s.title) + '" loading="lazy">' +
        '<div class="content">' +
        "<h3>" + esc(s.title) + "</h3>" +
        (s.description ? "<p style=\"color:var(--muted);font-size:.9rem;margin:.35rem 0\">" + esc(s.description) + "</p>" : "") +
        (s.price ? '<div class="price">' + formatPrice(s.price) + "</div>" : "") +
        "</div></div>"
      );
    }).join("");
  }

  async function loadGallery() {
    var root = document.getElementById("gallery-dynamic");
    if (!root) return;
    var res = await sb
      .from("gallery")
      .select("id,image_url,alt_text,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (res.error) {
      console.error(res.error);
      root.innerHTML = "";
      return;
    }
    var data = res.data;
    if (!data || !data.length) {
      root.innerHTML = "";
      return;
    }
    root.innerHTML = data.map(function (g) {
      return '<img src="' + esc(g.image_url) + '" alt="' + esc(g.alt_text || "Meatholic") + '" loading="lazy">';
    }).join("");
  }

  loadMenu();
  loadSpecials();
  loadGallery();
})();

// —— Reservation form ——
(function () {
  var SUPABASE_URL = "https://cjgybbaofhddmijbviyv.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_FPD8V7uI7g9gqSec7fL5Ug_yKqGeJg5";
  if (typeof supabase === "undefined") return;
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  var form = document.getElementById("book-form");
  if (!form) return;
  var msg = document.getElementById("book-msg");
  var btn = document.getElementById("book-submit");
  var dateInput = document.getElementById("reservation_date");
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var dd = String(today.getDate()).padStart(2, "0");
  dateInput.min = yyyy + "-" + mm + "-" + dd;
  dateInput.value = dateInput.min;

  var LAST_SUBMIT_KEY = "meatholic_last_book";
  var MIN_INTERVAL_MS = 60000;

  function showErr(text) {
    msg.className = "book-msg err";
    msg.textContent = text;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    msg.className = "book-msg";
    msg.textContent = "";

    try {
      var last = parseInt(localStorage.getItem(LAST_SUBMIT_KEY) || "0", 10);
      if (Date.now() - last < MIN_INTERVAL_MS) {
        showErr("Please wait a minute before sending another request.");
        return;
      }
    } catch (_) {}

    var guest_name = document.getElementById("guest_name").value.trim();
    var phone = document.getElementById("phone").value.trim();
    var email = document.getElementById("email").value.trim();
    var party_size = parseInt(document.getElementById("party_size").value, 10);
    var reservation_date = document.getElementById("reservation_date").value;
    var reservation_time = document.getElementById("reservation_time").value;
    var notes = document.getElementById("notes").value.trim();

    if (guest_name.length < 2 || guest_name.length > 120) {
      showErr("Please enter a valid name.");
      return;
    }
    if (phone.length < 7 || phone.length > 40) {
      showErr("Please enter a valid phone number.");
      return;
    }
    if (email && email.length > 120) {
      showErr("Email is too long.");
      return;
    }
    if (!(party_size >= 1 && party_size <= 30)) {
      showErr("Party size must be between 1 and 30.");
      return;
    }
    if (!reservation_date || reservation_date < dateInput.min) {
      showErr("Please choose a valid date.");
      return;
    }
    if (!reservation_time) {
      showErr("Please choose a time.");
      return;
    }
    if (notes.length > 500) {
      showErr("Notes must be under 500 characters.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Sending…";

    var payload = {
      guest_name: guest_name,
      phone: phone,
      email: email || null,
      party_size: party_size,
      reservation_date: reservation_date,
      reservation_time: reservation_time,
      notes: notes || null,
      status: "pending",
      source: "website"
    };

    try {
      var res = await sb.from("reservations").insert([payload]);
      if (res.error) throw res.error;
      try { localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now())); } catch (_) {}
      msg.className = "book-msg ok";
      msg.textContent = "Request sent! We will confirm by phone or WhatsApp shortly.";
      form.reset();
      dateInput.value = dateInput.min;
    } catch (err) {
      console.error(err);
      msg.className = "book-msg err";
      var detail = (err && err.message) ? String(err.message) : "";
      if (/row-level security|42501|policy/i.test(detail)) {
        msg.textContent = "Reservation system is being updated. Please call or WhatsApp +971 50 126 2191.";
      } else {
        msg.textContent = "Could not send request. Please call or WhatsApp +971 50 126 2191.";
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Request Reservation";
    }
  });
})();
