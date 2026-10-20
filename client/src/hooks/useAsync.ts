import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/http';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AsyncResult<T> extends AsyncState<T> {
  reload: () => void;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Não foi possível carregar os dados.';
}

interface AsyncSnapshot<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Carrega dados assíncronos reexecutando a carga quando as dependências mudam.
 * O estado é identificado pela chave da requisição, evitando renders em cascata.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncResult<T> {
  const [snapshot, setSnapshot] = useState<AsyncSnapshot<T> | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const loaderRef = useRef(loader);
  const key = `${JSON.stringify(deps)}::${reloadToken}`;

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  useEffect(() => {
    let active = true;

    loaderRef.current()
      .then((data) => {
        if (active) {
          setSnapshot({ key, data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setSnapshot({ key, data: null, error: getErrorMessage(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [key]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const current = snapshot?.key === key ? snapshot : null;

  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? null,
    reload,
  };
}
