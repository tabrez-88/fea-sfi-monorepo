/**
 * Shared CSV utilities for the Investor Pool import flow. Used by both
 * the rule snapshot wizard and the Deal Participants page so admins
 * get the same parsing rules (header variants, currency cleanup, etc.)
 * regardless of where they drop a file.
 */

export interface PoolCsvRow {
  name: string;
  investmentAmount: number;
  units: number;
  /** Optional, read from the CSV when a price column is present. */
  pricePerUnit?: number;
}

export interface PoolCsvParseResult {
  rows: PoolCsvRow[];
  errors: string[];
  /**
   * Non-error information about rows the parser intentionally ignored
   * (e.g. a "Total" summary row from a spreadsheet export). Rendered as
   * neutral text, not as a failure.
   */
  notices: string[];
}

/**
 * Spreadsheet exports (Numbers / Excel) often carry a trailing summary
 * row ("Total", "Grand Total", "Sum"). Importing it as an investor
 * silently doubles every pool number (Liang hit this on Deal 06), so
 * rows whose name matches are skipped with a notice.
 */
const SUMMARY_ROW_NAME = /^(sub\s*)?total$|^grand\s+total$|^sum$/i;

/**
 * Client-side CSV parser for the investor pool import. Tolerant of:
 *   - trailing newlines + blank rows
 *   - leading BOM (Excel-on-Windows writes one)
 *   - header reorderings + label variants
 *   - extra columns (Email, Ownership, KYC, Status, etc. ignored)
 *   - currency symbols + thousands separators in money cells
 *     (e.g. `"$33,000"` parses cleanly thanks to the RFC 4180 tokenizer)
 *   - trailing `%` on the units cell (stripped)
 *
 * An optional Unit Price column, when present, overrides the auto
 * compute (`investmentAmount / units`).
 */
export function parsePoolCsv(text: string): PoolCsvParseResult {
  const errors: string[] = [];
  const notices: string[] = [];
  // Strip a leading BOM (U+FEFF) before trimming. Excel writes one when
  // saving CSV on Windows, and a BOM left in the first header cell
  // would break the header-name lookup below.
  const noBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const stripped = noBom.trim();
  if (!stripped) return { rows: [], errors: ['File is empty.'], notices };

  const lines = stripped.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: ['File is empty.'], notices };

  const header = tokenizeCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const nameIdx = findHeaderIndex(header, [
    /^name$/,
    /^(legal|full|investor|participant)\s+name$/,
    /^name\b/,
    /\bname$/,
  ]);
  const investedIdx = findHeaderIndex(header, [
    /^investment\s*amount$/,
    /^amount\s*invested$/,
    /^invested$/,
    /^investment$/,
    /^amount$/,
  ]);
  const unitsIdx = findHeaderIndex(header, [
    /^units?$/,
    /^units?\s*held$/,
    /^no\.?\s*(of\s*)?units$/,
    /^#\s*units$/,
  ]);
  const priceIdx = findHeaderIndex(header, [
    /^unit\s*price$/,
    /^price\s*per\s*unit$/,
    /^price\s*\/\s*unit$/,
    /^priceperunit$/,
  ]);
  if (nameIdx === -1 || investedIdx === -1 || unitsIdx === -1) {
    errors.push(
      'CSV header must include Name, Investment Amount, and Units columns. Recognized variants: Name / Legal Name / Full Name; Investment Amount / Amount / Invested; Units / Units Held.',
    );
    return { rows: [], errors, notices };
  }

  const rows: PoolCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = tokenizeCsvLine(lines[i]!).map((c) => c.trim());
    const outcome = parsePoolRow(cells, i + 1, { nameIdx, investedIdx, unitsIdx, priceIdx });
    if (outcome.row) rows.push(outcome.row);
    if (outcome.error) errors.push(outcome.error);
    if (outcome.notice) notices.push(outcome.notice);
  }
  return { rows, errors, notices };
}

type PoolColumnIndexes = Readonly<{
  nameIdx: number;
  investedIdx: number;
  unitsIdx: number;
  priceIdx: number;
}>;

type PoolRowOutcome = Readonly<{
  row?: PoolCsvRow;
  error?: string;
  notice?: string;
}>;

function parsePoolRow(
  cells: string[],
  rowNum: number,
  { nameIdx, investedIdx, unitsIdx, priceIdx }: PoolColumnIndexes,
): PoolRowOutcome {
  const name = cells[nameIdx] ?? '';
  const investedRaw = cells[investedIdx] ?? '';
  const unitsRaw = cells[unitsIdx] ?? '';
  const priceRaw = priceIdx >= 0 ? (cells[priceIdx] ?? '') : '';

  if (!name) {
    return { error: `Row ${rowNum}: name is required.` };
  }
  if (SUMMARY_ROW_NAME.test(name)) {
    return { notice: `Row ${rowNum}: skipped summary row ("${name}").` };
  }

  const investmentAmount = Number(investedRaw.replace(/[$£€¥,]/g, ''));
  const units = Number(unitsRaw.replace(/[,%]/g, ''));
  const pricePerUnit = priceRaw
    ? Number(priceRaw.replace(/[$£€¥,]/g, ''))
    : Number.NaN;

  if (!Number.isFinite(investmentAmount) || investmentAmount < 0) {
    return { error: `Row ${rowNum}: investment amount "${investedRaw}" is invalid.` };
  }
  if (!Number.isFinite(units) || units < 0) {
    return { error: `Row ${rowNum}: units "${unitsRaw}" is invalid.` };
  }

  const row: PoolCsvRow = { name, investmentAmount, units };
  if (Number.isFinite(pricePerUnit) && pricePerUnit >= 0) {
    row.pricePerUnit = pricePerUnit;
  }
  return { row };
}

/** Find the first header index whose label matches any of the given patterns. */
function findHeaderIndex(header: string[], patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const idx = header.findIndex((h) => pattern.test(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Tokenize one CSV line into cells, honoring RFC 4180 double-quoted
 * fields: commas inside `"..."` are treated as literal, and `""`
 * inside a quoted field is the escape for a literal `"`. Unquoted
 * fields split on plain commas as before.
 *
 * Without this, Excel exports of `Investor A,"$33,000",33` are split
 * into 4 cells (`Investor A`, `"$33`, `000"`, `33`) and the dollar
 * amount stops parsing as a number.
 */
function tokenizeCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // Lookahead: `""` inside a quoted field is a literal quote.
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === ',') {
        cells.push(current);
        current = '';
      } else if (ch === '"' && current.length === 0) {
        // Opening quote on a fresh cell. Quotes mid-cell are treated
        // as literal characters (lenient since real-world CSV often has them).
        inQuotes = true;
      } else {
        current += ch;
      }
    }
  }
  cells.push(current);
  return cells;
}

/**
 * Client-side download of the Investor Pool CSV starter template.
 * Inline (no service round-trip) because the template is a static
 * fixed string; admins get the file the moment they click.
 */
export function downloadPoolCsvTemplate(filename = 'investor-pool-template.csv'): void {
  const csv = [
    'Name,Investment Amount,Units',
    'Alice Investor,5000,10',
    'Bob Capital,12500,25',
  ].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
