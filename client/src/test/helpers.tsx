import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeProvider';
import { ToastProvider } from '../context/ToastProvider';

export interface MockRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

export interface MockResponse {
  status?: number;
  body?: unknown;
}

export type MockHandler = (request: MockRequest) => MockResponse | unknown | Promise<MockResponse | unknown>;

export type RouteMap = Record<string, MockHandler | unknown>;

/** Envolve o componente com os provedores reais da aplicação (tema, toasts e rotas). */
export function renderWithProviders(ui: ReactElement, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

/** Igual a `renderWithProviders`, mas registra uma rota com parâmetros (ex.: /projetos/:id). */
export function renderWithRoute(ui: ReactElement, path: string, route = path) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <ToastProvider>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

function toMockResponse(result: MockResponse | unknown): MockResponse {
  if (
    result !== null &&
    typeof result === 'object' &&
    'status' in (result as Record<string, unknown>) &&
    'body' in (result as Record<string, unknown>)
  ) {
    return result as MockResponse;
  }

  return { status: 200, body: result };
}

/**
 * Instala um `fetch` simulado. As chaves das rotas usam o formato "METODO /caminho".
 * Rotas não simuladas respondem 404, o que ajuda a identificar chamadas inesperadas.
 */
export function installApiMock(routes: RouteMap) {
  const calls: MockRequest[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input.toString();
    const url = new URL(raw, 'http://localhost');
    const method = (init?.method ?? 'GET').toUpperCase();

    const request: MockRequest = {
      method,
      path: url.pathname,
      query: url.searchParams,
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    };

    calls.push(request);

    const key = `${method} ${url.pathname}`;
    const handler = routes[key];

    if (handler === undefined) {
      return new Response(JSON.stringify({ error: { message: `Rota não simulada: ${key}` } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = typeof handler === 'function' ? await (handler as MockHandler)(request) : handler;
    const response = toMockResponse(result);

    return new Response(response.status === 204 ? null : JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  vi.stubGlobal('fetch', fetchMock);

  return {
    calls,
    fetchMock,
    lastCall(method: string, path: string) {
      return [...calls].reverse().find((call) => call.method === method && call.path === path);
    },
    callsTo(method: string, path: string) {
      return calls.filter((call) => call.method === method && call.path === path);
    },
  };
}
