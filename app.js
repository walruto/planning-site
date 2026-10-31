import { canManageTeam, canRemoveMember, initials, money, parsePrice, summarize } from './planning-core.mjs';

const STORAGE_KEY = 'northstar-planning-v1';
const BUDGET = 12000;
const CATEGORIES = ['Software', 'Equipment', 'Research', 'Travel', 'Office', 'Other'];
const COLORS = ['#183f36', '#d49a55', '#88b7aa', '#efd6c4', '#718f87', '#b9a38f'];
const avatarColors = ['#efd7bd', '#cfe5de', '#e5d7cb', '#d8dfc7', '#d9d5e9', '#e8cabf'];
const $ = id => document.getElementById(id);

const seed = {
  activeUserId: 'u1',
  users: [
    { id: 'u1', name: 'Avery Morgan', role: 'Project lead', access: 3 },
    { id: 'u2', name: 'Maya Chen', role: 'Operations manager', access: 2 },
    { id: 'u3', name: 'Theo Bennett', role: 'Designer', access: 1 },
    { id: 'u4', name: 'Nia Foster', role: 'Researcher', access: 1 },
    { id: 'u5', name: 'Lucas Reed', role: 'Engineer', access: 1 }
  ],
  purchases: [
    { id: 'p1', purchaserId: 'u2', description: 'Team workshop supplies', date: '2026-10-28', location: 'Paper Source', reason: 'Materials for the quarterly planning workshop.', category: 'Office', price: 186.42 },
    { id: 'p2', purchaserId: 'u4', description: 'Research participant incentives', date: '2026-10-23', location: 'Tremendous', reason: 'Incentives for eight customer discovery sessions.', category: 'Research', price: 600 },
    { id: 'p3', purchaserId: 'u3', description: 'Design prototyping tools', date: '2026-10-17', location: 'Figma', reason: 'Annual prototyping tool subscription.', category: 'Software', price: 420 },
    { id: 'p4', purchaserId: 'u5', description: 'Development test device', date: '2026-10-09', location: 'Apple Store', reason: 'Cross-device quality assurance for the project.', category: 'Equipment', price: 899 },
    { id: 'p5', purchaserId: 'u1', description: 'Project kickoff travel', date: '2026-09-26', location: 'Alaska Airlines', reason: 'Travel to the in-person project kickoff.', category: 'Travel', price: 742.18 },
    { id: 'p6', purchaserId: 'u2', description: 'Planning software', date: '2026-08-12', location: 'Linear', reason: 'Annual issue tracking subscription.', category: 'Software', price: 480 },
    { id: 'p7', purchaserId: 'u4', description: 'Interview transcription', date: '2026-07-19', location: 'Rev', reason: 'Transcription for research interviews.', category: 'Research', price: 214.5 },
    { id: 'p8', purchaserId: 'u3', description: 'Stock illustration license', date: '2026-06-08', location: 'Adobe Stock', reason: 'Licensed visuals for project concepts.', category: 'Software', price: 179.99 },
    { id: 'p9', purchaserId: 'u1', description: 'Client planning lunch', date: '2026-05-14', location: 'Souvla', reason: 'Working session with the client team.', category: 'Other', price: 132.65 }
  ]
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.users?.length && Array.isArray(saved.purchases) ? saved : structuredClone(seed);
  } catch { return structuredClone(seed); }
}

let state = loadState();
const userById = id => state.users.find(user => user.id === id);
const activeUsers = () => state.users.filter(user => !user.removed);
const activeUser = () => userById(state.activeUserId) || state.users[0];
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function showToast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => $('toast').classList.remove('show'), 2800);
}

function route(name) {
  const page = document.querySelector(`[data-page="${name}"]`) ? name : 'overview';
  document.querySelectorAll('[data-page]').forEach(element => element.classList.toggle('active', element.dataset.page === page));
  document.querySelectorAll('.nav-link').forEach(element => element.classList.toggle('active', element.dataset.route === page));
  if (location.hash !== `#${page}`) history.replaceState(null, '', `#${page}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function avatar(user, index = state.users.indexOf(user)) {
  return `<span class="avatar" style="background:${avatarColors[index % avatarColors.length]}">${initials(user.name)}</span>`;
}

function purchaseRow(purchase, includeLocation = false) {
  const user = userById(purchase.purchaserId) || { name: 'Former member' };
  return `<tr><td>${escapeHtml(purchase.description)}</td><td><span class="person-cell">${avatar(user)}${escapeHtml(user.name)}</span></td><td>${dateLabel(purchase.date)}</td><td><span class="category-pill">${escapeHtml(purchase.category)}</span></td>${includeLocation ? `<td>${escapeHtml(purchase.location)}</td>` : ''}<td class="right"><b>${money(purchase.price)}</b></td></tr>`;
}

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

function renderProfile() {
  const user = activeUser();
  $('profile-avatar').textContent = initials(user.name);
  $('profile-name').textContent = user.name;
  $('profile-role').textContent = user.role;
  $('greeting-name').textContent = `${user.name.split(' ')[0]}.`;
  $('modal-user-name').textContent = user.name;
  $('profile-menu').innerHTML = activeUsers().map(member => `<button class="profile-option ${member.id === user.id ? 'selected' : ''}" type="button" role="option" aria-selected="${member.id === user.id}" data-user="${member.id}">${avatar(member)}<span>${escapeHtml(member.name)}</span></button>`).join('');
}

function renderOverview() {
  const sorted = [...state.purchases].sort((a, b) => b.date.localeCompare(a.date));
  const currentMonth = sorted.filter(purchase => purchase.date.slice(0, 7) === '2026-10');
  const summary = summarize(currentMonth);
  const active = new Set(currentMonth.filter(purchase => !userById(purchase.purchaserId)?.removed).map(purchase => purchase.purchaserId)).size;
  $('purchase-count').textContent = state.purchases.length;
  $('total-spend').textContent = money(summary.total);
  $('average-spend').textContent = money(summary.average);
  $('spend-caption').textContent = `Across ${summary.count} purchase${summary.count === 1 ? '' : 's'}`;
  $('active-purchasers').textContent = active;
  $('team-caption').textContent = `Of ${activeUsers().length} team members`;
  $('budget-spend').textContent = money(summary.total).replace('.00', '');
  const budgetPercent = Math.round(summary.total / BUDGET * 100);
  $('budget-percent').textContent = `${budgetPercent}%`;
  $('budget-progress').style.width = `${Math.min(100, budgetPercent)}%`;
  $('recent-purchases').innerHTML = sorted.slice(0, 5).map(purchase => purchaseRow(purchase)).join('') || '<tr class="empty-row"><td colspan="5">No purchases logged yet.</td></tr>';
  renderChart();
  renderCategories(currentMonth);
}

function renderChart() {
  const months = [5, 6, 7, 8, 9, 10].map(month => ({
    key: `2026-${String(month).padStart(2, '0')}`,
    label: new Date(2026, month - 1).toLocaleDateString('en-US', { month: 'short' })
  }));
  const totals = months.map(month => state.purchases.filter(purchase => purchase.date.startsWith(month.key)).reduce((sum, purchase) => sum + purchase.price, 0));
  const max = Math.max(...totals, 1);
  $('spend-chart').innerHTML = months.map((month, index) => `<div class="bar-group"><div class="bar ${index === months.length - 1 ? 'active' : ''}" style="height:${Math.max(3, totals[index] / max * 88)}%" data-value="${money(totals[index])}"></div><span>${month.label}</span></div>`).join('');
}

function renderCategories(purchases) {
  const totals = CATEGORIES.map(category => ({ category, total: purchases.filter(purchase => purchase.category === category).reduce((sum, purchase) => sum + purchase.price, 0) })).filter(item => item.total > 0).sort((a, b) => b.total - a.total);
  const total = totals.reduce((sum, item) => sum + item.total, 0);
  let cursor = 0;
  const segments = totals.map((item, index) => {
    const start = cursor;
    cursor += item.total / total * 100;
    return `${COLORS[index]} ${start}% ${cursor}%`;
  });
  $('category-donut').style.background = total ? `conic-gradient(${segments.join(',')})` : '#e9ebe6';
  $('category-total').textContent = total >= 1000 ? `$${(total / 1000).toFixed(1)}k` : money(total).replace('.00', '');
  $('category-legend').innerHTML = totals.slice(0, 4).map((item, index) => `<div class="legend-item"><i style="background:${COLORS[index]}"></i><span>${item.category}</span><b>${Math.round(item.total / total * 100)}%</b></div>`).join('') || '<span class="panel-note">No category data yet</span>';
}

function renderPurchases() {
  const query = $('purchase-search').value.trim().toLowerCase();
  const category = $('category-filter').value;
  const purchaser = $('purchaser-filter').value;
  const filtered = [...state.purchases].filter(purchase => {
    const text = `${purchase.description} ${purchase.location} ${purchase.reason}`.toLowerCase();
    return (!query || text.includes(query)) && (!category || purchase.category === category) && (!purchaser || purchase.purchaserId === purchaser);
  }).sort((a, b) => b.date.localeCompare(a.date));
  $('filtered-count').textContent = filtered.length;
  $('filtered-total').textContent = money(summarize(filtered).total);
  $('purchase-table').innerHTML = filtered.map(purchase => purchaseRow(purchase, true)).join('');
  $('purchase-empty').hidden = filtered.length > 0;
  $('purchase-table').closest('.table-wrap').hidden = filtered.length === 0;
}

function renderTeam() {
  const actor = activeUser();
  const isAdmin = canManageTeam(actor);
  $('open-member-modal').hidden = !isAdmin;
  $('team-permission-message').hidden = isAdmin;
  $('team-grid').innerHTML = activeUsers().map(user => {
    const purchases = state.purchases.filter(purchase => purchase.purchaserId === user.id);
    const access = ['Member', 'Member', 'Manager', 'Admin'][user.access] || 'Member';
    const action = isAdmin ? (user.id === actor.id ? '<span class="current-member">Current admin</span>' : canManageTeam(user) ? '<span class="current-member">Admin protected</span>' : `<button class="remove-member" type="button" data-remove-user="${user.id}">Remove member</button>`) : '';
    return `<article class="member-card"><div class="member-top">${avatar(user)}<span class="access-badge ${access.toLowerCase()}">${access}</span></div><h3>${escapeHtml(user.name)}</h3><p>${escapeHtml(user.role)}</p><div class="member-stats"><div><span>Purchases</span><b>${purchases.length}</b></div><div><span>Total spend</span><b>${money(summarize(purchases).total)}</b></div></div>${action ? `<div class="member-actions">${action}</div>` : ''}</article>`;
  }).join('');
}

function updateOptions() {
  const categoryOptions = CATEGORIES.map(category => `<option>${category}</option>`).join('');
  $('category-filter').innerHTML = '<option value="">All categories</option>' + categoryOptions;
  document.querySelector('#purchase-form [name="category"]').innerHTML = '<option value="" disabled selected>Select category</option>' + categoryOptions;
  $('purchaser-filter').innerHTML = '<option value="">Everyone</option>' + state.users.map(user => `<option value="${user.id}">${escapeHtml(user.name)}${user.removed ? ' (former)' : ''}</option>`).join('');
}

function renderAll() {
  updateOptions();
  renderProfile();
  renderOverview();
  renderPurchases();
  renderTeam();
}

function openPurchaseModal() {
  const form = $('purchase-form');
  form.reset();
  form.elements.date.value = '2026-10-31';
  $('price-error').textContent = '';
  $('purchase-modal').showModal();
  form.elements.description.focus();
}

document.querySelectorAll('[data-route]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); route(link.dataset.route); }));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => {
  route(button.dataset.go);
  if (button.hasAttribute('data-open-purchase')) openPurchaseModal();
}));
$('open-purchase-modal').addEventListener('click', openPurchaseModal);
$('open-member-modal').addEventListener('click', () => {
  if (!canManageTeam(activeUser())) return showToast('Only admins can add team members.');
  $('member-form').reset();
  $('member-modal').showModal();
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));

$('profile-button').addEventListener('click', () => {
  const menu = $('profile-menu');
  menu.hidden = !menu.hidden;
  $('profile-button').setAttribute('aria-expanded', String(!menu.hidden));
});
$('profile-menu').addEventListener('click', event => {
  const button = event.target.closest('[data-user]');
  if (!button) return;
  state.activeUserId = button.dataset.user;
  save();
  renderProfile();
  renderTeam();
  $('profile-menu').hidden = true;
  showToast(`Now acting as ${activeUser().name}`);
});

$('team-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-remove-user]');
  if (!button) return;
  const member = userById(button.dataset.removeUser);
  if (!canRemoveMember(activeUser(), member)) return showToast(member?.access === 3 ? 'Admin accounts cannot be removed.' : 'Only admins can remove team members.');
  if (!confirm(`Remove ${member.name} from the team? Their purchase history will be kept.`)) return;
  member.removed = true;
  save();
  renderAll();
  showToast(`${member.name} was removed from the team.`);
});

['purchase-search', 'category-filter', 'purchaser-filter'].forEach(id => $(id).addEventListener('input', renderPurchases));

$('purchase-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const price = parsePrice(data.get('price'));
  if (price === null) {
    $('price-error').textContent = 'Enter a positive amount with up to two decimal places.';
    form.elements.price.focus();
    return;
  }
  state.purchases.push({
    id: crypto.randomUUID(), purchaserId: activeUser().id, description: data.get('description').trim(),
    date: data.get('date'), location: data.get('location').trim(), category: data.get('category'),
    reason: data.get('reason').trim(), price
  });
  save();
  renderAll();
  $('purchase-modal').close();
  showToast('Purchase logged and linked to your profile.');
});

$('member-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!canManageTeam(activeUser())) {
    $('member-modal').close();
    return showToast('Only admins can add team members.');
  }
  const data = new FormData(event.currentTarget);
  state.users.push({ id: crypto.randomUUID(), name: data.get('name').trim(), role: data.get('role'), access: Number(data.get('access')) });
  save();
  renderAll();
  $('member-modal').close();
  showToast('Team member added.');
});

window.addEventListener('hashchange', () => route(location.hash.slice(1)));
renderAll();
route(location.hash.slice(1) || 'overview');
