import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has been stable for `delay` ms. The output lags
 * behind the input by exactly `delay` ms; rapid changes reset the timer so
 * intermediate values never appear downstream. Used by autocomplete inputs
 * to throttle network fetches while the user types.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
