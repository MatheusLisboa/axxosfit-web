/** Máscaras de entrada — Brasil */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCPF(value: string): string {
  const v = onlyDigits(value).slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskPhone(value: string): string {
  const v = onlyDigits(value).slice(0, 11);
  if (v.length <= 10) {
    return v.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return v.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskCEP(value: string): string {
  const v = onlyDigits(value).slice(0, 8);
  return v.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function maskCREF(value: string): string {
  const upper = value.toUpperCase().replace(/[^0-9A-Z/\-GSP]/g, '');
  return upper.slice(0, 20);
}

export function maskDateBR(value: string): string {
  const v = onlyDigits(value).slice(0, 8);
  if (v.length <= 2) return v;
  if (v.length <= 4) return `${v.slice(0, 2)}/${v.slice(2)}`;
  return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
}

/** Converte dd/mm/aaaa → yyyy-mm-dd para input type=date / Supabase */
export function dateBRToISO(br: string): string {
  const p = br.split('/');
  if (p.length !== 3) return br;
  const [d, m, y] = p;
  if (y.length === 4) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return br;
}

export function dateISOToBR(iso: string): string {
  if (!iso || !iso.includes('-')) return iso;
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export function buildAddressLine(parts: {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}): string {
  const line1 = [parts.street, parts.number].filter(Boolean).join(', ');
  const line2 = [parts.complement, parts.neighborhood].filter(Boolean).join(' — ');
  const line3 = [parts.city, parts.state].filter(Boolean).join(' / ');
  const cep = parts.cep ? `CEP ${parts.cep}` : '';
  return [line1, line2, line3, cep].filter(Boolean).join(' | ');
}
