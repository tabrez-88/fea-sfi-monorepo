'use client';

import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerFieldProps = Readonly<{
  /** ISO date string (yyyy-MM-dd) or empty string. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Compact variant (40px height) used in filter rows. Form fields stay 48px. */
  size?: 'default' | 'sm';
  /**
   * Renders a compact icon-only trigger (calendar glyph + chevron, no text).
   * Matches the Figma Deal-List filter "📅 ▾" square button. `size` is ignored
   * when iconOnly is true; the trigger is always 48×auto on desktop and
   * matches filter-bar height.
   */
  iconOnly?: boolean;
}>;

function toIsoDateString(date: Date): string {
  // yyyy-MM-dd, local timezone — matches <input type="date">
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calendar + Popover date picker styled to match the Figma "Placeholder" date
 * field: left calendar icon, right chevron, 48px height in forms (40px in
 * filter rows). Drop-in replacement for `<input type="date">` with a richer
 * calendar UX. Value is an ISO `yyyy-MM-dd` string, empty when unset.
 */
export function DatePickerField({
  value,
  onChange,
  placeholder = 'Placeholder',
  disabled,
  ariaInvalid,
  ariaLabel,
  className,
  size = 'default',
  iconOnly = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const display = formatDisplay(value);

  if (iconOnly) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel ?? placeholder}
            aria-invalid={ariaInvalid}
            className={cn(
              'h-[48px] w-auto shrink-0 justify-center gap-1.5 rounded-[8px] border border-border bg-white px-3 font-normal',
              'text-[14px] leading-[20px] text-foreground',
              'hover:bg-white hover:border-foreground/40',
              'focus-visible:border-foreground focus-visible:ring-0',
              'aria-[invalid=true]:border-danger',
              value && 'border-foreground',
              className,
            )}
            title={display || placeholder}
          >
            <CalendarIcon
              aria-hidden
              className="size-4 shrink-0 text-foreground"
              strokeWidth={2}
            />
            <ChevronDown aria-hidden className="size-4 shrink-0 text-neutral" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(toIsoDateString(day));
                setOpen(false);
              } else {
                onChange('');
              }
            }}
            autoFocus
          />
          {value && (
            <div className="flex items-center justify-end border-t border-border p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="gap-1.5 text-neutral hover:text-foreground"
              >
                <X aria-hidden className="size-3.5" strokeWidth={2} />
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          aria-invalid={ariaInvalid}
          className={cn(
            'w-full justify-between gap-2 rounded-[8px] border border-border bg-white px-4 font-normal',
            'text-[16px] leading-[20px] tracking-[0.032px] text-foreground',
            'hover:bg-white hover:border-foreground/40',
            'focus-visible:border-foreground focus-visible:ring-0',
            'aria-[invalid=true]:border-danger',
            size === 'default' ? 'h-[48px]' : 'h-[40px] text-[14px]',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarIcon
              aria-hidden
              className="size-4 shrink-0 text-neutral"
              strokeWidth={2}
            />
            <span
              className={cn(
                'truncate',
                !display && 'text-neutral font-normal',
              )}
            >
              {display || placeholder}
            </span>
          </span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-neutral" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => {
            if (day) {
              onChange(toIsoDateString(day));
              setOpen(false);
            } else {
              onChange('');
            }
          }}
          autoFocus
        />
        {value && (
          <div className="flex items-center justify-end border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="gap-1.5 text-neutral hover:text-foreground"
            >
              <X aria-hidden className="size-3.5" strokeWidth={2} />
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
