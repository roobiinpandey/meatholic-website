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
  var msg = document.getElementById('book-msg');
  var btn = document.getElementById('book-submit');
  var dateInput = document.getElementById('reservation_date');
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = String(today.getMonth()+1).padStart(2,'0');
  var dd = String(today.getDate()).padStart(2,'0');
  dateInput.min = yyyy + '-' + mm + '-' + dd;
  dateInput.value = dateInput.min;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    msg.className = 'book-msg';
    msg.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Sending…';
    var payload = {
      guest_name: document.getElementById('guest_name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim() || null,
      party_size: parseInt(document.getElementById('party_size').value, 10),
      reservation_date: document.getElementById('reservation_date').value,
      reservation_time: document.getElementById('reservation_time').value,
      notes: document.getElementById('notes').value.trim() || null,
      status: 'pending',
      source: 'website'
    };
    try {
      var res = await sb.from('reservations').insert([payload]);
      if (res.error) throw res.error;
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
