export function normalizePhone(value) {
  const trimmed = value.trim();
  if (!/^[+\d\s().-]+$/.test(trimmed)) return null;
  const compact = trimmed.replace(/[\s().-]/g, '');
  if (/^0[1-9]\d{8}$/.test(compact)) return `+94${compact.slice(1)}`;
  if (/^94\d{9}$/.test(compact)) return `+${compact}`;
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  return null;
}
