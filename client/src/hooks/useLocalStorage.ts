import { useCallback, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [value, setStoredValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (next: T) => {
      setStoredValue(next);

      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Preferências visuais seguem valendo na sessão atual mesmo sem persistência.
      }
    },
    [key],
  );

  return [value, setValue];
}
