'use client';

import {
  Archive,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  FileText,
  MoreHorizontal,
  Search,
  Upload,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { DatePickerField } from '@/components/common/DatePickerField';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { ArchiveDocumentDialog } from '@/components/documents/ArchiveDocumentDialog';
import { DocumentPreviewDrawer } from '@/components/documents/DocumentPreviewDrawer';
import { UploadDocumentDrawer } from '@/components/documents/UploadDocumentDrawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import {
  DEFAULT_PAGE_SIZE,
  DOCUMENT_TYPE_GROUPS,
  DOCUMENT_TYPE_GROUP_MEMBERS,
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPE_TONE,
  type DocumentTypeGroup,
} from '@/constants/ui';
import { useArchiveDocument } from '@/hooks/documents/useArchiveDocument';
import { useDealDocuments } from '@/hooks/documents/useDealDocuments';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import type { Document, DocumentType } from '@/types/document.types';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';

type ArchivedFilter = 'active' | 'archived' | 'all';
type SortField = 'fileName' | 'uploadedAt' | 'fileSize';
type SortOrder = 'asc' | 'desc';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5'] as const;

/**
 * Column template — Screen 3.4 layout:
 *   File Name · Type · Linked To · Size · Uploaded By · Uploaded At · Kebab
 */
const GRID_COLS =
  'grid grid-cols-[minmax(180px,1.6fr)_minmax(120px,0.9fr)_minmax(140px,1.1fr)_minmax(80px,0.5fr)_minmax(120px,0.9fr)_minmax(120px,0.9fr)_56px]';

type DocumentsListViewProps = Readonly<{
  dealId: string;
}>;

/**
 * MS-3 Screen 3.4 — Documents List.
 *
 * Layout mirrors `RevenueBatchesListView` for visual consistency:
 *   - Title + search + date filter + Upload button (Figma toolbar)
 *   - Stat cards for the 5 filter tabs (All / Contracts / Revenue Reports /
 *     Settlement Reports / Other) — click to filter
 *   - Bordered card holding the type filter dropdown + table
 *
 * The BE returns a `linkedTo` field per Wave 4 gap #7 so the "Linked To"
 * column renders "The Last Horizon" / "RB-2026-004" / "Run #2" without any
 * client-side resolution.
 */
export function DocumentsListView({ dealId }: DocumentsListViewProps) {
  const [search, setSearch] = useState('');
  const [uploadedFrom, setUploadedFrom] = useState('');
  const [group, setGroup] = useState<DocumentTypeGroup>('All');
  const [archivedFilter] = useState<ArchivedFilter>('active');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pendingArchive, setPendingArchive] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const archiveMutation = useArchiveDocument();

  const params = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      sortBy,
      sortOrder,
      archived: archivedFilter === 'active' ? 'false' as const : archivedFilter === 'archived' ? 'true' as const : 'all' as const,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(uploadedFrom ? { uploadedFrom } : {}),
    }),
    [page, sortBy, sortOrder, archivedFilter, search, uploadedFrom],
  );

  const { data, isLoading, isError, refetch } = useDealDocuments(dealId, params);

  function handleRetry() {
    refetch().catch(() => undefined);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'fileName' ? 'asc' : 'desc');
    }
  }

  async function handleConfirmArchive(reason: string) {
    if (!pendingArchive) return;
    try {
      await archiveMutation.mutateAsync({
        id: pendingArchive.id,
        ...(reason ? { reason } : {}),
      });
      toast.success(`${pendingArchive.fileName} archived`);
      setPendingArchive(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to archive document. Please try again.'));
    }
  }

  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  // Memoize the array reference so the two downstream useMemo blocks
  // don't re-run every render when the query cache returns a new [] shell.
  const allDocs = useMemo<ReadonlyArray<Document>>(
    () => data?.data ?? [],
    [data],
  );

  // BE returns a single `?docType=` filter but the design tabs group
  // multiple types. We keep the BE query broad and apply the group
  // filter client-side against the current page.
  const visibleDocs = useMemo(() => {
    if (group === 'All') return allDocs;
    const allowed = new Set(DOCUMENT_TYPE_GROUP_MEMBERS[group]);
    return allDocs.filter((d) => allowed.has(d.docType));
  }, [allDocs, group]);

  const counts = useMemo(() => {
    const map: Record<DocumentTypeGroup, number> = {
      All: total,
      Contracts: 0,
      'Revenue Reports': 0,
      'Settlement Reports': 0,
      Other: 0,
    };
    for (const d of allDocs) {
      for (const key of Object.keys(DOCUMENT_TYPE_GROUP_MEMBERS) as ReadonlyArray<
        Exclude<DocumentTypeGroup, 'All'>
      >) {
        if (DOCUMENT_TYPE_GROUP_MEMBERS[key].includes(d.docType)) {
          map[key] += 1;
        }
      }
    }
    return map;
  }, [allDocs, total]);

  const isEmpty = !isLoading && total === 0;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Overview" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Documents
        </h1>

        <div className="flex w-full flex-col gap-3 lg:max-w-[640px] lg:flex-row lg:items-center lg:justify-end lg:gap-3">
          <div className="relative w-full lg:max-w-[280px] lg:flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral"
              strokeWidth={2}
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by file name"
              className="pl-9"
              aria-label="Search documents by file name"
            />
          </div>

          <DatePickerField
            value={uploadedFrom}
            onChange={setUploadedFrom}
            placeholder="Filter by upload date"
            ariaLabel="Filter by upload date"
            iconOnly
          />

          <Button
            type="button"
            className="w-full lg:w-auto"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="size-4" aria-hidden />
            Upload Document
          </Button>
        </div>
      </div>

      <section
        aria-labelledby="documents-count-heading"
        className="flex flex-col gap-5 overflow-hidden rounded-[8px] border border-border bg-white p-4 sm:p-6"
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2
            id="documents-count-heading"
            className="text-[24px] font-bold leading-[28px] tracking-[0.048px] text-foreground"
          >
            Documents ({formatNumber(total)})
          </h2>
        </header>

        {!isEmpty && (
          <DocumentGroupCards
            isLoading={isLoading}
            counts={counts}
            activeGroup={group}
            onFilterChange={(next) => {
              setGroup(next);
              setPage(1);
            }}
          />
        )}

        {isEmpty ? (
          <EmptyState
            icon={FileText}
            title="No documents uploaded yet"
            description="Attach contracts, revenue reports, and other supporting files so your deal has a complete evidentiary record."
            action={{
              label: (
                <>
                  <Upload className="size-4" aria-hidden />
                  Upload Document
                </>
              ),
              onClick: () => setUploadOpen(true),
            }}
            className="border-dashed"
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end">
              <GroupFilterDropdown
                active={group}
                counts={counts}
                onChange={(next) => {
                  setGroup(next);
                  setPage(1);
                }}
              />
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[880px]">
                <div className={cn(GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
                  <HeaderCell>
                    <SortButton
                      field="fileName"
                      currentField={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                      label="File Name"
                    />
                  </HeaderCell>
                  <HeaderCell>Type</HeaderCell>
                  <HeaderCell>Linked To</HeaderCell>
                  <HeaderCell>
                    <SortButton
                      field="fileSize"
                      currentField={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                      label="Size"
                    />
                  </HeaderCell>
                  <HeaderCell>Uploaded By</HeaderCell>
                  <HeaderCell>
                    <SortButton
                      field="uploadedAt"
                      currentField={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                      label="Uploaded At"
                    />
                  </HeaderCell>
                  <HeaderCell>
                    <span className="sr-only">Actions</span>
                  </HeaderCell>
                </div>

                <DocumentRows
                  isLoading={isLoading}
                  isError={isError}
                  documents={visibleDocs}
                  onRetry={handleRetry}
                  dealId={dealId}
                  onRequestArchive={setPendingArchive}
                  onRequestPreview={setPreviewDoc}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {meta && meta.total > 0 && (
        <Pagination
          page={meta.page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="justify-center"
        />
      )}

      <ArchiveDocumentDialog
        open={pendingArchive !== null}
        onOpenChange={(next) => {
          if (!next) setPendingArchive(null);
        }}
        doc={pendingArchive}
        isPending={archiveMutation.isPending}
        onConfirm={(reason) => void handleConfirmArchive(reason)}
      />

      <DocumentPreviewDrawer
        open={previewDoc !== null}
        onOpenChange={(next) => {
          if (!next) setPreviewDoc(null);
        }}
        doc={previewDoc}
      />

      <UploadDocumentDrawer
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        dealId={dealId}
      />
    </div>
  );
}

/* ─── Group stat cards (Screen 3.4 tabs, stat-card style) ───────────────── */

type DocumentGroupCardsProps = Readonly<{
  isLoading: boolean;
  counts: Record<DocumentTypeGroup, number>;
  activeGroup: DocumentTypeGroup;
  onFilterChange: (next: DocumentTypeGroup) => void;
}>;

function DocumentGroupCards({
  isLoading,
  counts,
  activeGroup,
  onFilterChange,
}: DocumentGroupCardsProps) {
  const items: ReadonlyArray<{ label: DocumentTypeGroup; text: string }> = [
    { label: DOCUMENT_TYPE_GROUPS.ALL, text: 'All' },
    { label: DOCUMENT_TYPE_GROUPS.CONTRACTS, text: 'Contracts' },
    { label: DOCUMENT_TYPE_GROUPS.REVENUE_REPORTS, text: 'Revenue Reports' },
    { label: DOCUMENT_TYPE_GROUPS.SETTLEMENT_REPORTS, text: 'Settlement Reports' },
    { label: DOCUMENT_TYPE_GROUPS.OTHER, text: 'Other' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      {items.map((item) => {
        const isActive = item.label === activeGroup;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onFilterChange(item.label)}
            aria-pressed={isActive}
            className={cn(
              'group flex min-h-[100px] flex-col justify-between gap-2 rounded-[8px] border border-border bg-white p-4 text-left text-foreground transition-colors sm:min-h-[110px]',
              'hover:border-foreground/60 focus-visible:border-foreground focus-visible:outline-none',
              isActive && 'border-foreground bg-foreground text-background',
            )}
          >
            <span
              className={cn(
                'text-[13px] font-medium leading-[18px] transition-colors',
                isActive
                  ? 'text-background/80'
                  : 'text-neutral group-hover:text-foreground',
              )}
            >
              {item.text}
            </span>
            {isLoading ? (
              <Skeleton className="h-8 w-14" />
            ) : (
              <span className="text-[28px] font-semibold leading-[32px] tracking-[-0.56px]">
                {formatNumber(counts[item.label])}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Group filter dropdown ─────────────────────────────────────────────── */

type GroupFilterDropdownProps = Readonly<{
  active: DocumentTypeGroup;
  counts: Record<DocumentTypeGroup, number>;
  onChange: (next: DocumentTypeGroup) => void;
}>;

function GroupFilterDropdown({ active, counts, onChange }: GroupFilterDropdownProps) {
  const options = Object.values(DOCUMENT_TYPE_GROUPS);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          {active} <ChevronDown className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'flex items-center justify-between gap-6',
              active === opt && 'bg-grey-100 font-semibold',
            )}
          >
            <span>{opt}</span>
            <span className="text-neutral">({formatNumber(counts[opt])})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Rows ──────────────────────────────────────────────────────────────── */

type DocumentRowsProps = Readonly<{
  isLoading: boolean;
  isError: boolean;
  documents: ReadonlyArray<Document>;
  onRetry: () => void;
  dealId: string;
  onRequestArchive: (doc: Document) => void;
  onRequestPreview: (doc: Document) => void;
}>;

function DocumentRows({
  isLoading,
  isError,
  documents,
  onRetry,
  onRequestArchive,
  onRequestPreview,
}: DocumentRowsProps) {
  if (isLoading) {
    return (
      <>
        {SKELETON_ROWS.map((key) => (
          <RowSkeleton key={key} />
        ))}
      </>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-[14px] text-danger">Failed to load documents.</p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-[14px] text-neutral">No documents match the selected filter.</p>
      </div>
    );
  }

  return (
    <>
      {documents.map((d, idx) => (
        <DocumentRow
          key={d.id}
          doc={d}
          isLast={idx === documents.length - 1}
          onRequestArchive={onRequestArchive}
          onRequestPreview={onRequestPreview}
        />
      ))}
    </>
  );
}

type DocumentRowProps = Readonly<{
  doc: Document;
  isLast: boolean;
  onRequestArchive: (doc: Document) => void;
  onRequestPreview: (doc: Document) => void;
}>;

function DocumentRow({
  doc,
  isLast,
  onRequestArchive,
  onRequestPreview,
}: DocumentRowProps) {
  return (
    <div
      className={cn(
        GRID_COLS,
        isLast ? '' : 'border-b border-grey-100',
        'bg-white',
      )}
    >
      <BodyCell>
        <button
          type="button"
          onClick={() => onRequestPreview(doc)}
          className="truncate border-b border-foreground/40 text-left text-[14px] font-medium leading-[20px] text-foreground transition-colors hover:border-foreground hover:text-foreground/80"
          title={doc.fileName}
        >
          {doc.fileName}
        </button>
      </BodyCell>
      <BodyCell>
        <Badge
          size="sm"
          variant={DOCUMENT_TYPE_TONE[doc.docType as DocumentType]}
          className="whitespace-nowrap"
        >
          {DOCUMENT_TYPE_LABEL[doc.docType as DocumentType]}
        </Badge>
      </BodyCell>
      <BodyCell>
        <span className="truncate text-[14px] text-neutral" title={doc.linkedTo.label}>
          {doc.linkedTo.label}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-foreground">{formatFileSize(doc.fileSize)}</span>
      </BodyCell>
      <BodyCell>
        <span className="truncate text-[14px] text-neutral">
          {doc.uploadedBy?.name ?? 'System'}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-neutral">{formatDate(doc.uploadedAt)}</span>
      </BodyCell>
      <BodyCell className="justify-center px-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-neutral hover:text-foreground"
              aria-label={`Actions for ${doc.fileName}`}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => onRequestArchive(doc)}
              className="text-danger focus:bg-danger/10 focus:text-danger"
            >
              <Archive className="size-4" aria-hidden />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </BodyCell>
    </div>
  );
}

/* ─── Shared table cells + skeletons ────────────────────────────────────── */

function HeaderCell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex items-center px-[10px] py-[14px]">
      <span className="text-[14px] font-bold leading-[20px] tracking-[0.028px] text-foreground">
        {children}
      </span>
    </div>
  );
}

function BodyCell({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <div className={cn('flex h-[52px] items-center px-[10px] py-[14px]', className)}>
      {children}
    </div>
  );
}

type SortButtonProps = Readonly<{
  field: SortField;
  currentField: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
  label: string;
}>;

function SortButton({ field, currentField, order, onSort, label }: SortButtonProps) {
  const active = field === currentField;
  const Icon = active ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 text-[14px] font-bold leading-[20px] tracking-[0.028px] text-foreground hover:text-foreground/80"
    >
      {label}
      <Icon
        className={cn(
          'size-3.5 shrink-0 transition-transform',
          active && order === 'asc' && 'rotate-180',
          active ? 'text-foreground' : 'text-neutral',
        )}
        aria-hidden
      />
    </button>
  );
}

function RowSkeleton() {
  return (
    <div className={cn(GRID_COLS, 'border-b border-grey-100')}>
      <BodyCell>
        <Skeleton className="h-4 w-40" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-5 w-24 rounded-[12px]" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-32" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-12" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-20" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-20" />
      </BodyCell>
      <BodyCell className="justify-center px-0">
        <Skeleton className="size-6 rounded-md" />
      </BodyCell>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}
