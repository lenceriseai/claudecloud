
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

const glow = $('.cursor-glow');
window.addEventListener('pointermove', e => {
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
});

const progress = $('.scrollbar span');
window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  progress.style.height = `${(scrollY / h) * 100}%`;
  $$('.parallax').forEach(el => {
    const speed = parseFloat(el.dataset.speed || .08);
    const rect = el.getBoundingClientRect();
    const y = (rect.top - innerHeight/2) * speed;
    el.style.transform = `translate3d(0, ${y}px, 0) scale(1.12)`;
  });
}, {passive:true});

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, {threshold:.16});
$$('.reveal').forEach(el => io.observe(el));

$$('.magnetic').forEach(btn => {
  btn.addEventListener('pointermove', e => {
    const r = btn.getBoundingClientRect();
    btn.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.08}px, ${(e.clientY-r.top-r.height/2)*.14}px)`;
  });
  btn.addEventListener('pointerleave', () => btn.style.transform = '');
});

const tabs = $('#menuTabs');
const grid = $('#menuGrid');
let activeCategory = typeof MENU_DATA !== 'undefined' ? MENU_DATA[0]?.category : undefined;

function renderTabs(){
  tabs.innerHTML = MENU_DATA.map(cat => `<button class="${cat.category===activeCategory?'active':''}" role="tab">${cat.category}</button>`).join('');
  $$('button', tabs).forEach(btn => {
    btn.onclick = () => { activeCategory = btn.textContent; renderTabs(); renderMenu(); };
  });
}
function renderMenu(){
  const category = MENU_DATA.find(c => c.category === activeCategory);
  grid.innerHTML = category.items.map(item => `
    <article class="menu-card reveal visible">
      <img src="${item.image}" alt="${item.name}">
      <div class="content">
        <div class="top"><span class="dish-no">${item.no}</span><span class="price">${item.price}</span></div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p class="ai-image-note">AI-generated image. Actual dish presentation and portion size may vary.</p>
      </div>
    </article>
  `).join('');
}
if (tabs && grid && activeCategory) {
  renderTabs();
  renderMenu();
}

$('.menu-toggle').addEventListener('click', () => {
  const nav = $('.nav');
  nav.style.display = nav.style.display === 'flex' ? '' : 'flex';
  nav.style.position = 'fixed';
  nav.style.left = '18px';
  nav.style.right = '18px';
  nav.style.top = '78px';
  nav.style.padding = '18px';
  nav.style.borderRadius = '20px';
  nav.style.background = 'rgba(9,7,5,.92)';
  nav.style.backdropFilter = 'blur(18px)';
  nav.style.flexDirection = 'column';
});

const reserveForm = $('#reserveForm');
if (reserveForm) {
  const reserveStatus = $('#reserveFormStatus');

  reserveForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(reserveForm);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      date: String(formData.get('date') || '').trim(),
      time: String(formData.get('time') || '').trim(),
      guests: String(formData.get('guests') || '').trim(),
      comment: String(formData.get('comment') || '').trim(),
    };

    const requiredMissing = !payload.name || !payload.phone || !payload.date || !payload.time || !payload.guests;
    if (requiredMissing) {
      reserveStatus.textContent = 'Please fill in all required fields before sending.';
      return;
    }

    const subject = `Reservation Request - ${payload.name}`;
    const body = [
      'New reservation request:',
      '',
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      `Date: ${payload.date}`,
      `Time: ${payload.time}`,
      `Guests: ${payload.guests}`,
      `Comment: ${payload.comment || 'None'}`,
      '',
      'Source: Oriental Phoenix website form',
    ].join('\n');

    const to = 'duk8@telus.net';
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    reserveStatus.textContent = 'Opening your email app to send the reservation request...';
    window.location.href = mailto;
  });
}

// Temporary Halloween hours notice. It expires at midnight in Edmonton.
const holidayHoursPopupConfig = {
  timeZone: 'America/Edmonton',
  end: {
    year: 2026,
    month: 11,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  },
};

const isHolidayHoursPopupPreview = new URLSearchParams(window.location.search)
  .get('holiday-hours-preview') === '1';

function getComparableStamp(parts) {
  return ((((((parts.year * 100) + parts.month) * 100 + parts.day) * 100 + parts.hour) * 100 + parts.minute) * 100 + parts.second);
}

function getTimePartsInZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function canShowHolidayHoursPopup(date = new Date()) {
  const now = getComparableStamp(getTimePartsInZone(date, holidayHoursPopupConfig.timeZone));
  const end = getComparableStamp(holidayHoursPopupConfig.end);
  return now < end;
}

function createHolidayHoursPopup() {
  if (document.querySelector('[data-holiday-hours-popup]')) return;

  let popupPollTimer = null;
  const previouslyFocused = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'holiday-hours-popup';
  overlay.setAttribute('data-holiday-hours-popup', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'holidayHoursPopupTitle');
  overlay.setAttribute('aria-describedby', 'holidayHoursPopupDescription');
  overlay.innerHTML = `
    <div class="holiday-hours-popup__leaves" aria-hidden="true"></div>
    <div class="holiday-hours-popup__panel" role="document">
      <button class="holiday-hours-popup__close" type="button" aria-label="Close Halloween hours notice">×</button>
      <h2 id="holidayHoursPopupTitle" class="visually-hidden">Halloween Hours</h2>
      <p id="holidayHoursPopupDescription" class="visually-hidden">Trick or treat! We are open today from 12 PM to 3 PM.</p>
      <img class="holiday-hours-popup__image" src="assets/halloween-hours-2026.png" alt="Halloween hours: we are open today from 12 PM to 3 PM. Come on in!" width="1122" height="1402">
    </div>
  `;

  const leaves = overlay.querySelector('.holiday-hours-popup__leaves');
  const leafShapes = ['🎃', '🦇', '👻'];
  const leafCount = window.matchMedia('(max-width: 640px)').matches ? 9 : 16;
  for (let index = 0; index < leafCount; index += 1) {
    const leaf = document.createElement('span');
    leaf.className = 'holiday-hours-popup__leaf';
    leaf.textContent = leafShapes[index % leafShapes.length];
    leaf.style.setProperty('--leaf-x', `${(index * 37) % 101}%`);
    leaf.style.setProperty('--leaf-delay', `${-((index * 1.17) % 9)}s`);
    leaf.style.setProperty('--leaf-duration', `${7 + (index % 5) * 1.15}s`);
    leaf.style.setProperty('--leaf-drift', `${-46 + (index * 19) % 92}px`);
    leaf.style.setProperty('--leaf-size', `${18 + (index % 4) * 5}px`);
    leaves.appendChild(leaf);
  }

  const closeButton = overlay.querySelector('.holiday-hours-popup__close');
  const close = () => {
    if (!overlay.isConnected) return;
    if (popupPollTimer !== null) clearInterval(popupPollTimer);
    document.removeEventListener('keydown', onKeyDown);
    overlay.classList.remove('is-open');
    window.setTimeout(() => overlay.remove(), 220);
    document.body.classList.remove('has-holiday-hours-popup');
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus();
    }
  };

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector('.holiday-hours-popup__panel').addEventListener('click', (event) => {
    event.stopPropagation();
  });

  document.body.appendChild(overlay);
  document.body.classList.add('has-holiday-hours-popup');
  document.addEventListener('keydown', onKeyDown);
  window.requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    closeButton.focus();
  });

  popupPollTimer = window.setInterval(() => {
    if (!isHolidayHoursPopupPreview && !canShowHolidayHoursPopup()) close();
  }, 60000);
}

if (isHolidayHoursPopupPreview || canShowHolidayHoursPopup()) {
  createHolidayHoursPopup();
}
