import { useState, useEffect } from 'react';
import type { ParsedData } from '../types/data';
import { parseExcelFile } from '../utils/excelParser';

interface UseExcelDataResult {
  data: ParsedData | null;
  loading: boolean;
  error: string | null;
}

export function useExcelData(): UseExcelDataResult {
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const parsed = await parseExcelFile('/data/Rate Review Dashboard Query.xlsx');
        if (!cancelled) {
          setData(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
