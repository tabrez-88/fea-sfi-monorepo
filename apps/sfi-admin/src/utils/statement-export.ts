import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  ReportCategory,
  type ParticipantStatement,
} from '@/types/reports.types';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  RECOUPMENT: 'Recoupment',
  NET_PROFIT: 'Net Profit',
  FEES: 'Fees',
};

/** Column order used by both exports so they read identically. */
const CATEGORY_ORDER: ReadonlyArray<ReportCategory> = [
  ReportCategory.RECOUPMENT,
  ReportCategory.NET_PROFIT,
  ReportCategory.FEES,
];

function fileStem(statement: ParticipantStatement): string {
  const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `statement-${safe(statement.dealName)}-${safe(statement.participantName)}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** RFC 4180 escaping so names with commas or quotes survive the round-trip. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Statement as CSV: a metadata block, then one row per settlement with the
 * phase split, then the totals row. Opens cleanly in Excel and Numbers.
 */
export function exportStatementCsv(statement: ParticipantStatement): void {
  const rows: string[] = [];

  rows.push(['Participant Statement'].map(csvCell).join(','));
  rows.push(['Deal', statement.dealName].map(csvCell).join(','));
  rows.push(['Participant', statement.participantName].map(csvCell).join(','));
  rows.push(['Role', statement.roleName].map(csvCell).join(','));
  rows.push(['Currency', statement.currency].map(csvCell).join(','));
  rows.push(
    ['Generated', formatDate(statement.generatedAt)].map(csvCell).join(','),
  );
  rows.push('');

  rows.push(
    [
      'Settlement',
      'Type',
      ...CATEGORY_ORDER.map((p) => CATEGORY_LABEL[p]),
      'Total',
      'Finalized',
      'Proof Hash',
    ]
      .map(csvCell)
      .join(','),
  );

  for (const s of statement.settlements) {
    rows.push(
      [
        s.runLabel,
        s.runType,
        ...CATEGORY_ORDER.map((p) => s.byPhase[p] ?? 0),
        s.total,
        formatDate(s.finalizedAt),
        s.proofHash ?? '',
      ]
        .map(csvCell)
        .join(','),
    );
  }

  rows.push(
    [
      'Total',
      '',
      statement.summary.totalRecoupment,
      statement.summary.totalNetProfit,
      statement.summary.totalFees,
      statement.summary.totalReceived,
      '',
      '',
    ]
      .map(csvCell)
      .join(','),
  );

  const blob = new Blob([rows.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  triggerDownload(blob, `${fileStem(statement)}.csv`);
}

/**
 * Branded PDF statement: FEA header band, deal and participant block,
 * summary figures, the settlement breakdown table, and the proof hashes
 * that back each payout. Generated client-side, so no server round-trip
 * and no data leaves the browser.
 */
export function exportStatementPdf(statement: ParticipantStatement): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // ─── Header band ───────────────────────────────────────────────────────
  doc.setFillColor(17, 17, 17);
  doc.rect(0, 0, pageWidth, 72, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FEA', margin, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Participant Statement', margin, 52);

  doc.setFontSize(9);
  doc.text(
    `Generated ${formatDate(statement.generatedAt)}`,
    pageWidth - margin,
    52,
    { align: 'right' },
  );

  // ─── Identity block ────────────────────────────────────────────────────
  doc.setTextColor(17, 17, 17);
  let y = 104;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(statement.participantName, margin, y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `${statement.roleName}  |  ${statement.dealName}  |  ${statement.currency}`,
    margin,
    y,
  );

  // ─── Summary ───────────────────────────────────────────────────────────
  y += 28;
  const { summary, currency } = statement;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fontStyle: 'bold', textColor: [17, 17, 17] },
    head: [['Total Received', 'Recoupment', 'Net Profit', 'Settlements']],
    body: [
      [
        formatCurrency(summary.totalReceived, currency),
        formatCurrency(summary.totalRecoupment, currency),
        formatCurrency(summary.totalNetProfit, currency),
        String(summary.settlementCount),
      ],
    ],
  });

  // ─── Settlement breakdown ──────────────────────────────────────────────
  const afterSummary =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 17, 17);
  doc.text('Settlement Breakdown', margin, afterSummary + 28);

  autoTable(doc, {
    startY: afterSummary + 38,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [244, 244, 244], textColor: [17, 17, 17] },
    head: [
      [
        'Settlement',
        'Type',
        ...CATEGORY_ORDER.map((p) => CATEGORY_LABEL[p]),
        'Total',
        'Finalized',
      ],
    ],
    body:
      statement.settlements.length > 0
        ? statement.settlements.map((s) => [
            s.runLabel,
            s.runType,
            ...CATEGORY_ORDER.map((p) =>
              s.byPhase[p] ? formatCurrency(s.byPhase[p], currency) : '-',
            ),
            formatCurrency(s.total, currency),
            formatDate(s.finalizedAt),
          ])
        : [['No settlements have paid this participant yet.', '', '', '', '', '', '']],
    foot:
      statement.settlements.length > 0
        ? [
            [
              'Total',
              '',
              formatCurrency(summary.totalRecoupment, currency),
              formatCurrency(summary.totalNetProfit, currency),
              formatCurrency(summary.totalFees, currency),
              formatCurrency(summary.totalReceived, currency),
              '',
            ],
          ]
        : [],
    footStyles: { fillColor: [244, 244, 244], textColor: [17, 17, 17], fontStyle: 'bold' },
  });

  // ─── Proof records ─────────────────────────────────────────────────────
  const withProof = statement.settlements.filter((s) => s.proofHash);
  if (withProof.length > 0) {
    const afterBreakdown =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? afterSummary + 80;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Proof Records', margin, afterBreakdown + 28);

    autoTable(doc, {
      startY: afterBreakdown + 38,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 5, font: 'courier' },
      headStyles: {
        fillColor: [244, 244, 244],
        textColor: [17, 17, 17],
        font: 'helvetica',
      },
      head: [['Settlement', 'Proof Hash']],
      body: withProof.map((s) => [s.runLabel, s.proofHash ?? '']),
    });
  }

  doc.save(`${fileStem(statement)}.pdf`);
}
