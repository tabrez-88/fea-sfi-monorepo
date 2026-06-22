'use client';

import { Download, Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Banner } from '@/components/common/Banner';
import { CsvDropzone } from '@/components/participants/import/CsvDropzone';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeal } from '@/hooks/deals/useDeal';
import { useCreateParticipant } from '@/hooks/participants/useCreateParticipant';
import { getApiErrorMessage } from '@/lib/axios';
import { Currency } from '@/types/deal.types';
import { ParticipantBehavior } from '@/types/participant.types';
import { formatCurrency, formatNumber } from '@/utils/format';

import {
  downloadPoolCsvTemplate,
  parsePoolCsv,
  type PoolCsvParseResult,
} from './pool-csv';

type InvestorPoolManagementCardProps = Readonly<{
  dealId: string;
  /**
   * Optional shell override. When omitted, the component renders inside
   * its own bordered card (used standalone on the Deal Participants
   * page). The rule snapshot wizard wraps the body in its own
   * SectionCard so it can pass a function here to skip the inner card.
   */
  shell?: (children: ReactNode, headerRight: ReactNode) => ReactNode;
  /** Overrides the default card title. */
  title?: string;
  /** Overrides the default card description. */
  description?: string;
}>;

type PoolImportStatus =
  | { kind: 'idle' }
  | { kind: 'importing'; total: number; done: number }
  | {
      kind: 'done';
      imported: number;
      failures: ReadonlyArray<{ name: string; reason: string }>;
    };

/**
 * Investor Pool management UI. Drag-drop CSV + per-row create via the
 * existing participants endpoint (defaults `behaviorType: RECOUPMENT,
 * poolMember: true, roleName: 'Investor'`) plus a single-investor
 * inline modal and an Export Template download.
 *
 * Used in two places:
 *   - Deal Participants page (standalone card)
 *   - Rule snapshot wizard Step 2 (wrapped in its SectionCard via the
 *     `shell` prop so it inherits the wizard's section styling)
 *
 * All persistence goes through `useCreateParticipant` so the React
 * Query invalidate chain refreshes the participants list everywhere
 * (deal overview, wizard pool count, settlement preview).
 */
export function InvestorPoolManagementCard({
  dealId,
  shell,
  title = 'Investor Pool Configuration',
  description = 'Define the internal share breakdown for the Investor Pool.',
}: InvestorPoolManagementCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<PoolCsvParseResult | null>(null);
  const [importStatus, setImportStatus] = useState<PoolImportStatus>({
    kind: 'idle',
  });
  const [addInvestorOpen, setAddInvestorOpen] = useState(false);

  const createMutation = useCreateParticipant(dealId);

  // Parse client-side on file pick so the admin sees a preview before
  // confirming. The actual POSTs only run on Confirm Import.
  useEffect(() => {
    if (!file) {
      setParsed(null);
      setImportStatus({ kind: 'idle' });
      return;
    }
    let cancelled = false;
    file
      .text()
      .then((text) => {
        if (!cancelled) setParsed(parsePoolCsv(text));
      })
      .catch(() => {
        if (!cancelled) {
          setParsed({ rows: [], errors: ['Could not read the file.'] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  async function handleConfirmImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setImportStatus({ kind: 'importing', total: parsed.rows.length, done: 0 });

    const failures: Array<{ name: string; reason: string }> = [];
    let done = 0;

    for (const row of parsed.rows) {
      try {
        // CSV-supplied price wins; fall back to investmentAmount / units.
        const computedPrice =
          row.units > 0 ? row.investmentAmount / row.units : undefined;
        const pricePerUnit = row.pricePerUnit ?? computedPrice;
        await createMutation.mutateAsync({
          name: row.name,
          roleName: 'Investor',
          behaviorType: ParticipantBehavior.RECOUPMENT,
          poolMember: true,
          investmentAmount: row.investmentAmount,
          units: row.units,
          ...(pricePerUnit !== undefined ? { pricePerUnit } : {}),
        });
      } catch (err) {
        failures.push({
          name: row.name,
          reason: getApiErrorMessage(err, 'Create failed.'),
        });
      } finally {
        done += 1;
        setImportStatus({ kind: 'importing', total: parsed.rows.length, done });
      }
    }

    const imported = parsed.rows.length - failures.length;
    setImportStatus({ kind: 'done', imported, failures });

    if (failures.length === 0) {
      toast.success(
        `Imported ${imported} pool ${imported === 1 ? 'member' : 'members'} into the deal.`,
      );
      setFile(null);
      setParsed(null);
    } else if (imported > 0) {
      toast.warning(
        `Imported ${imported} of ${parsed.rows.length}. ${failures.length} row${failures.length === 1 ? '' : 's'} failed (see details below).`,
      );
    } else {
      toast.error('None of the rows could be imported. See details below.');
    }
  }

  const importing = importStatus.kind === 'importing';
  const hasParsedRows = (parsed?.rows.length ?? 0) > 0;
  const canConfirm = hasParsedRows && !importing;

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setAddInvestorOpen(true)}
      >
        <Plus className="size-4" aria-hidden strokeWidth={1.75} />
        Add Investor Manually
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => downloadPoolCsvTemplate()}
      >
        <Download className="size-4" aria-hidden strokeWidth={1.75} />
        Export Template
      </Button>
    </div>
  );

  const body = (
    <>
      <CsvDropzone
        file={file}
        onFileChange={setFile}
        idleCopy="Drag & drop pool CSV here,"
        disabled={importing}
      />
      <p className="text-[12px] leading-[16px] text-neutral">
        Required columns:{' '}
        <span className="font-semibold">Name</span>,{' '}
        <span className="font-semibold">Investment Amount</span>,{' '}
        <span className="font-semibold">Units</span>. Variants like Legal Name,
        Amount, Units Held are also accepted, and any extra columns (Email,
        Ownership, KYC, Status, etc.) are ignored. An optional Unit Price
        column overrides the auto-computed price. Use Export Template above
        to download a starter file.
      </p>
      {parsed && <PoolCsvPreviewTable parsed={parsed} />}

      {hasParsedRows && importStatus.kind !== 'done' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border bg-grey-50/40 px-3 py-3">
          <p className="text-[13px] text-foreground">
            {importing ? (
              <>
                Importing {importStatus.done} of {importStatus.total}
                ...
              </>
            ) : (
              <>
                Ready to import {parsed!.rows.length}{' '}
                {parsed!.rows.length === 1 ? 'investor' : 'investors'} as pool
                members.
              </>
            )}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleConfirmImport()}
            disabled={!canConfirm}
          >
            {importing ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Importing...
              </>
            ) : (
              <>
                <Plus className="size-4" aria-hidden strokeWidth={1.75} />
                Confirm Import ({parsed!.rows.length})
              </>
            )}
          </Button>
        </div>
      )}

      {importStatus.kind === 'done' && importStatus.failures.length > 0 && (
        <Banner tone="warning">
          <p className="font-semibold">
            Imported {importStatus.imported} of{' '}
            {importStatus.imported + importStatus.failures.length}.{' '}
            {importStatus.failures.length} row
            {importStatus.failures.length === 1 ? '' : 's'} failed:
          </p>
          <ul className="ml-4 mt-1 list-disc space-y-0.5">
            {importStatus.failures.map((f) => (
              <li key={f.name}>
                <span className="font-semibold">{f.name}</span>: {f.reason}
              </li>
            ))}
          </ul>
        </Banner>
      )}

      <AddInvestorInlineDialog
        dealId={dealId}
        open={addInvestorOpen}
        onOpenChange={setAddInvestorOpen}
      />
    </>
  );

  if (shell) {
    return <>{shell(body, headerActions)}</>;
  }

  return (
    <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] font-bold leading-[24px] text-foreground">
            {title}
          </h2>
          <p className="text-[13px] leading-[18px] text-neutral">{description}</p>
        </div>
        {headerActions}
      </header>
      <div className="flex flex-col gap-3">{body}</div>
    </section>
  );
}

/* ─── Pool CSV preview ──────────────────────────────────────────────────── */

function PoolCsvPreviewTable({ parsed }: Readonly<{ parsed: PoolCsvParseResult }>) {
  const totalInvested = parsed.rows.reduce((acc, r) => acc + r.investmentAmount, 0);
  const totalUnits = parsed.rows.reduce((acc, r) => acc + r.units, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">
          Parsed {parsed.rows.length}{' '}
          {parsed.rows.length === 1 ? 'investor' : 'investors'}
          {totalUnits > 0 && (
            <span className="font-normal text-neutral">
              {' '}
              · {formatNumber(totalUnits)} units · {formatCurrency(totalInvested)} total
            </span>
          )}
        </p>
      </div>
      {parsed.errors.length > 0 && (
        <Banner tone="danger">
          <p className="font-semibold">CSV has issues:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {parsed.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Banner>
      )}
      {parsed.rows.length > 0 && (
        <div className="overflow-hidden rounded-[8px] border border-border">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-x-3 border-b border-grey-200 bg-grey-50 px-3 py-2 text-[12px] font-bold text-foreground">
            <span>Name</span>
            <span>Investment</span>
            <span>Units</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {parsed.rows.map((row, idx) => (
              <div
                key={`${row.name}-${idx}`}
                className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-x-3 border-t border-grey-100 px-3 py-2 text-[13px] text-foreground first:border-t-0"
              >
                <span className="truncate">{row.name}</span>
                <span>{formatCurrency(row.investmentAmount)}</span>
                <span>{formatNumber(row.units)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Inline "Add Investor Manually" modal ──────────────────────────────── */

type AddInvestorInlineDialogProps = Readonly<{
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

/**
 * Single-investor inline form. Posts via `useCreateParticipant` with
 * `behaviorType: RECOUPMENT, poolMember: true, roleName: 'Investor'`
 * pre-filled. Currency glyph follows the deal's currency.
 */
function AddInvestorInlineDialog({
  dealId,
  open,
  onOpenChange,
}: AddInvestorInlineDialogProps) {
  const dealQuery = useDeal(dealId);
  const currency: Currency = dealQuery.data?.currency ?? Currency.USD;
  const currencyGlyph = useMemo(() => {
    const map: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF', CAD: 'C$', AUD: 'A$',
    };
    return map[currency] ?? currency;
  }, [currency]);

  const createMutation = useCreateParticipant(dealId);

  const [name, setName] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [units, setUnits] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setInvestmentAmount('');
    setUnits('');
    setPricePerUnit('');
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    const inv = investmentAmount.trim() === '' ? undefined : Number(investmentAmount);
    const u = units.trim() === '' ? undefined : Number(units);
    const p = pricePerUnit.trim() === '' ? undefined : Number(pricePerUnit);
    if (inv !== undefined && (!Number.isFinite(inv) || inv < 0)) {
      setError('Investment amount must be a non-negative number.');
      return;
    }
    if (u !== undefined && (!Number.isFinite(u) || u < 0)) {
      setError('Units must be a non-negative number.');
      return;
    }
    if (p !== undefined && (!Number.isFinite(p) || p < 0)) {
      setError('Price per unit must be a non-negative number.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: trimmedName,
        roleName: 'Investor',
        behaviorType: ParticipantBehavior.RECOUPMENT,
        poolMember: true,
        ...(inv !== undefined ? { investmentAmount: inv } : {}),
        ...(u !== undefined ? { units: u } : {}),
        ...(p !== undefined ? { pricePerUnit: p } : {}),
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to add investor. Please try again.'));
    }
  }

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Investor Manually</DialogTitle>
          <DialogDescription className="text-[14px] leading-[20px] text-neutral">
            Adds a single investor to the Investor Pool on this deal. The
            participant is created with behavior{' '}
            <span className="font-semibold text-foreground">Recoupment</span>
            {' '}and{' '}
            <span className="font-semibold text-foreground">
              Part of Investor Pool
            </span>{' '}
            checked.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="add-investor-name"
              className="text-[13px] font-medium text-foreground"
            >
              Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="add-investor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice Investor"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="add-investor-amount"
                className="text-[13px] font-medium text-foreground"
              >
                Investment Amount
              </Label>
              <Input
                id="add-investor-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder={`${currencyGlyph}50,000`}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="add-investor-units"
                className="text-[13px] font-medium text-foreground"
              >
                Units
              </Label>
              <Input
                id="add-investor-units"
                type="number"
                inputMode="numeric"
                min={0}
                step="1"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="100"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="add-investor-price"
              className="text-[13px] font-medium text-foreground"
            >
              Price per Unit
            </Label>
            <Input
              id="add-investor-price"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              placeholder={`${currencyGlyph}500`}
              disabled={isSubmitting}
            />
            <p className="text-[12px] leading-[16px] text-neutral">
              Optional. Leave blank to auto-compute from Investment / Units.
            </p>
          </div>

          {error && <Banner tone="danger">{error}</Banner>}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add Investor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
