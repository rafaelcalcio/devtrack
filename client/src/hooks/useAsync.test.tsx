import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsync } from './useAsync';

describe('useAsync', () => {
  it('carrega os dados e sinaliza o fim do carregamento', async () => {
    const { result } = renderHook(() => useAsync(async () => ['ok'], []));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(['ok']);
    expect(result.current.error).toBeNull();
  });

  it('expõe a mensagem de erro quando a carga falha', async () => {
    const { result } = renderHook(() =>
      useAsync(async () => {
        throw new Error('Falha de rede');
      }, []),
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Falha de rede');
    });

    expect(result.current.data).toBeNull();
  });

  it('recarrega os dados quando reload é chamado', async () => {
    const loader = vi.fn(async () => 'conteúdo');
    const { result } = renderHook(() => useAsync(loader, []));

    await waitFor(() => {
      expect(result.current.data).toBe('conteúdo');
    });

    result.current.reload();

    await waitFor(() => {
      expect(loader).toHaveBeenCalledTimes(2);
    });
  });

  it('recarrega quando as dependências mudam', async () => {
    const loader = vi.fn(async () => 'conteúdo');
    const { result, rerender } = renderHook(({ id }) => useAsync(loader, [id]), {
      initialProps: { id: 1 },
    });

    await waitFor(() => {
      expect(result.current.data).toBe('conteúdo');
    });

    rerender({ id: 2 });

    await waitFor(() => {
      expect(loader).toHaveBeenCalledTimes(2);
    });
  });
});
