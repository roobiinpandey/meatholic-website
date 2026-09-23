(function(){
  var links=document.querySelectorAll('.nav-links a[href^="#"]'),sections=[];
  links.forEach(function(link){var id=link.getAttribute('href').slice(1),el=document.getElementById(id);if(el)sections.push({id:id,el:el})});
  function setActive(id){links.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+id)})}
  function onScroll(){var offset=120,current=sections[0]&&sections[0].id;for(var i=0;i<sections.length;i++){if(sections[i].el.getBoundingClientRect().top-offset<=0)current=sections[i].id}if((window.innerHeight+window.scrollY)>=document.body.offsetHeight-80)current=sections[sections.length-1]&&sections[sections.length-1].id;if(current)setActive(current)}
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('load',onScroll);onScroll();
  links.forEach(function(link){link.addEventListener('click',function(){var id=link.getAttribute('href').slice(1);setTimeout(function(){setActive(id)},50)})});
})();

(function(){
  var SUPABASE_URL = "https://cjgybbaofhddmijbviyv.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_FPD8V7uI7g9gqSec7fL5Ug_yKqGeJg5";
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  var form = document.getElementById('book-form');
  if (!form) return;
  var msg = document.getElementById('book-msg');
  var btn = document.getElementById('book-submit');
  var dateInput = document.getElementById('reservation_date');
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = String(today.getMonth()+1).padStart(2,'0');
  var dd = String(today.getDate()).padStart(2,'0');
  dateInput.min = yyyy + '-' + mm + '-' + dd;
  dateInput.value = dateInput.min;

  var LAST_SUBMIT_KEY = 'meatholic_last_book';
  var MIN_INTERVAL_MS = 60000;

  function showErr(text) {
    msg.className = 'book-msg err';
    msg.textContent = text;
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    msg.className = 'book-msg';
    msg.textContent = '';

    try {
      var last = parseInt(localStorage.getItem(LAST_SUBMIT_KEY) || '0', 10);
      if (Date.now() - last < MIN_INTERVAL_MS) {
        showErr('Please wait a minute before sending another request.');
        return;
      }
    } catch (_) {}

    var guest_name = document.getElementById('guest_name').value.trim();
    var phone = document.getElementById('phone').value.trim();
    var email = document.getElementById('email').value.trim();
    var party_size = parseInt(document.getElementById('party_size').value, 10);
    var reservation_date = document.getElementById('reservation_date').value;
    var reservation_time = document.getElementById('reservation_time').value;
    var notes = document.getElementById('notes').value.trim();

    if (guest_name.length < 2 || guest_name.length > 120) {
      showErr('Please enter a valid name.');
      return;
    }
    if (phone.length < 7 || phone.length > 40) {
      showErr('Please enter a valid phone number.');
      return;
    }
    if (email && email.length > 120) {
      showErr('Email is too long.');
      return;
    }
    if (!(party_size >= 1 && party_size <= 30)) {
      showErr('Party size must be between 1 and 30.');
      return;
    }
    if (!reservation_date || reservation_date < dateInput.min) {
      showErr('Please choose a valid date.');
      return;
    }
    if (notes.length > 500) {
      showErr('Notes must be under 500 characters.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    var payload = {
      guest_name: guest_name,
      phone: phone,
      email: email || null,
      party_size: party_size,
      reservation_date: reservation_date,
      reservation_time: reservation_time,
      notes: notes || null,
      status: 'pending',
      source: 'website'
    };

    try {
      var res = await sb.from('reservations').insert([payload]);
      if (res.error) throw res.error;
      try { localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now())); } catch (_) {}
      msg.className = 'book-msg ok';
      msg.textContent = 'Request sent! We will confirm by phone or WhatsApp shortly.';
      form.reset();
      dateInput.value = dateInput.min;
    } catch (err) {
      console.error(err);
      msg.className = 'book-msg err';
      msg.textContent = 'Could not send request. Please call or WhatsApp +971 50 126 2191.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Request Reservation';
    }
  });
})();
