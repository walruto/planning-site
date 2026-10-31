export const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);

export function parsePrice(value) {
  const normalized = String(value).trim().replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}

export function initials(name) {
  return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
}

export function summarize(purchases) {
  const total = purchases.reduce((sum, purchase) => sum + purchase.price, 0);
  return { total, average: purchases.length ? total / purchases.length : 0, count: purchases.length };
}

export const canManageTeam = user => Number(user?.access) === 3 && !user?.removed;

export const canRemoveMember = (actor, member) => canManageTeam(actor) && Boolean(member) && actor.id !== member.id && Number(member.access) !== 3 && !member.removed;
