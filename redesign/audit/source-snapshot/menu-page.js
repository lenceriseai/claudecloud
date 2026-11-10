const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const tabs = $('#fullMenuTabs');
const searchInput = $('#menuSearch');
const countEl = $('#menuResultCount');
const content = $('#fullMenuContent');

const categories = MENU_DATA.map((category) => category.category);
let activeCategory = 'All';
let query = '';

function normalize(value) {
  return String(value).toLowerCase().trim();
}

function includeItem(item, categoryName) {
  const categoryMatch = activeCategory === 'All' || activeCategory === categoryName;
  if (!categoryMatch) return false;
  if (!query) return true;

  const haystack = normalize(`${item.no} ${item.name} ${item.description} ${item.price} ${categoryName}`);
  return haystack.includes(query);
}

function renderTabs() {
  const allTabs = ['All', ...categories];
  tabs.innerHTML = allTabs
    .map((tab) => `<button class="${tab === activeCategory ? 'active' : ''}" role="tab">${tab}</button>`)
    .join('');

  $$('button', tabs).forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.textContent;
      renderTabs();
      renderMenu();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function dishCard(item, categoryName) {
  return `
    <article class="menu-card reveal visible" data-dish-id="${item.no}">
      <img loading="lazy" src="${item.image}" alt="${item.name}">
      <div class="content">
        <div class="top">
          <span class="dish-no">#${item.no}</span>
          <span class="price">${item.price}</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p class="ai-image-note">AI-generated image. Actual dish presentation and portion size may vary.</p>
        <span class="dish-category">${categoryName}</span>
      </div>
    </article>
  `;
}

function categoryBlock(categoryName, items) {
  return `
    <section class="full-category-block" id="${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">
      <header class="full-category-header">
        <h2>${categoryName}</h2>
        <p>${items.length} item${items.length === 1 ? '' : 's'}</p>
      </header>
      <div class="menu-grid">${items.map((item) => dishCard(item, categoryName)).join('')}</div>
    </section>
  `;
}

function renderMenu() {
  let total = 0;
  const blocks = MENU_DATA.map((category) => {
    const filtered = category.items.filter((item) => includeItem(item, category.category));
    total += filtered.length;
    if (!filtered.length) return '';
    return categoryBlock(category.category, filtered);
  }).filter(Boolean);

  content.innerHTML = blocks.length
    ? blocks.join('')
    : '<div class="full-menu-empty"><h2>No dishes found</h2><p>Try another search or category filter.</p></div>';

  countEl.textContent = `${total} dish${total === 1 ? '' : 'es'} shown`;
}

searchInput.addEventListener('input', (event) => {
  query = normalize(event.target.value);
  renderMenu();
});

renderTabs();
renderMenu();
