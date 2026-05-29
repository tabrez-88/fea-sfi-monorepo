'use client';

import { FileIcon, X } from 'lucide-react';
import { useCallback, useId, useRef, useState, type DragEvent } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ACCEPTED_MIME = 'text/csv';
const ACCEPTED_EXT = '.csv';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB sanity cap

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type CsvDropzoneProps = Readonly<{
  /** Currently-selected file, lifted to the parent so the orchestrator owns it. */
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** Disables the dropzone while a server request is in flight. */
  disabled?: boolean;
  /** Optional override of the dashed-border idle copy. */
  idleCopy?: string;
}>;

/**
 * Reusable CSV file-pick + drag-drop area. Used in `ImportCsvStep` and
 * `ReuploadCsvStep`. Validates the file's MIME / extension / size client-side
 * so server rejections are rare and immediate feedback is fast.
 *
 * When a file is selected, replaces the dropzone with a compact "chosen
 * file" summary plus a remove button so the user can swap files without
 * closing the modal.
 */
export function CsvDropzone({
  file,
  onFileChange,
  disabled = false,
  idleCopy,
}: CsvDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = useCallback((candidate: File): string | null => {
    const isCsv =
      candidate.type === ACCEPTED_MIME ||
      candidate.name.toLowerCase().endsWith(ACCEPTED_EXT);
    if (!isCsv) return 'Only .csv files are supported.';
    if (candidate.size > MAX_SIZE_BYTES) {
      return `File is too large (max ${formatBytes(MAX_SIZE_BYTES)}).`;
    }
    return null;
  }, []);

  function acceptFile(candidate: File) {
    const err = validate(candidate);
    if (err) {
      setValidationError(err);
      onFileChange(null);
      return;
    }
    setValidationError(null);
    onFileChange(candidate);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  if (file) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-grey-50/50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileIcon
              aria-hidden
              className="size-5 shrink-0 text-foreground"
              strokeWidth={1.75}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-semibold text-foreground">
                {file.name}
              </span>
              <span className="text-[12px] text-neutral">
                {formatBytes(file.size)}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              onFileChange(null);
              setValidationError(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            disabled={disabled}
            aria-label="Remove selected file"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_EXT}
          className="sr-only"
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            if (chosen) acceptFile(chosen);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-[8px] border-2 border-dashed px-4 py-10 text-center transition-colors',
          dragOver
            ? 'border-foreground bg-grey-50/70'
            : 'border-border bg-white',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <p className="text-[16px] font-semibold leading-[20px] text-foreground">
          {idleCopy ?? 'Drag & drop CSV here,'}
        </p>
        <span className="text-[14px] text-neutral">or</span>
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <FileIcon className="size-4" aria-hidden strokeWidth={1.75} />
          Browse File
        </Button>
        <p className="text-[12px] text-neutral">
          Supported: .csv only. Max {formatBytes(MAX_SIZE_BYTES)} per import.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_EXT}
          className="sr-only"
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            if (chosen) acceptFile(chosen);
          }}
        />
      </div>
      {validationError && (
        <p role="alert" className="text-[12px] text-danger">
          {validationError}
        </p>
      )}
    </div>
  );
}
