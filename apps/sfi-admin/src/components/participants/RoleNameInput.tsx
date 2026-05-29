'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/common/useDebouncedValue';
import { useParticipantRoles } from '@/hooks/participants/useParticipantRoles';
import { cn } from '@/lib/utils';

type RoleNameInputProps = Readonly<{
  id?: string;
  dealId: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string | undefined;
  'aria-invalid'?: boolean | undefined;
  'aria-describedby'?: string | undefined;
}>;

/**
 * Role Name combobox. Free-text input that opens a dropdown of existing
 * role names on the deal as the user types or focuses. Designed for the
 * Add Participant form: the dropdown is purely advisory, the user is free
 * to type any new role name and submit it.
 *
 * Behavior:
 * - Suggestions fetched server-side from `GET /deals/:id/participants/roles`
 *   with a debounced `q` derived from the current input value.
 * - Dropdown opens on focus when there are suggestions; closes on blur,
 *   Escape, or after the user clicks/keyboards a suggestion.
 * - Arrow Down / Arrow Up navigate, Enter selects, Escape closes.
 * - The currently-typed value is never overwritten by suggestions, only
 *   by an explicit pick.
 */
export function RoleNameInput({
  id,
  dealId,
  value,
  onChange,
  placeholder,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: RoleNameInputProps) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-role-input`;
  const listboxId = `${autoId}-role-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedValue = useDebouncedValue(value.trim(), 200);
  const { data, isFetching } = useParticipantRoles(dealId, debouncedValue);

  // Filter out an exact case-insensitive match of the current input from the
  // dropdown — there's no point suggesting something the user already typed.
  const suggestions = useMemo(() => {
    const all = data ?? [];
    const current = value.trim().toLowerCase();
    if (!current) return all;
    return all.filter((s) => s.toLowerCase() !== current);
  }, [data, value]);

  // Reset highlight whenever the suggestion list changes shape.
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  // Close dropdown when clicking outside the input + listbox combo.
  useEffect(() => {
    if (!open) return undefined;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  function pick(suggestion: string) {
    onChange(suggestion);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setOpen(true);
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setOpen(true);
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      );
    } else if (e.key === 'Enter') {
      const candidate = open && activeIndex >= 0 ? suggestions[activeIndex] : undefined;
      if (candidate !== undefined) {
        e.preventDefault();
        pick(candidate);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  const showDropdown =
    open && (suggestions.length > 0 || (isFetching && debouncedValue.length > 0));

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={inputId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
        }
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-[8px] border border-border bg-white py-1 shadow-md"
        >
          {suggestions.length === 0 && isFetching && (
            <div className="flex items-center gap-2 px-3 py-2 text-[13px] text-neutral">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Loading suggestions...
            </div>
          )}
          {suggestions.map((suggestion, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={suggestion}
                id={`${listboxId}-opt-${idx}`}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => {
                  // Prevent the input from losing focus before the click handler
                  // fires, otherwise the dropdown closes before pick() runs.
                  e.preventDefault();
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => pick(suggestion)}
                className={cn(
                  'flex w-full items-center px-3 py-2 text-left text-[14px] leading-[20px] text-foreground transition-colors',
                  isActive ? 'bg-grey-50' : 'bg-white hover:bg-grey-50',
                )}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
