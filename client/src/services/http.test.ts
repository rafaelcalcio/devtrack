import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, buildQuery } from './http';

describe('buildQuery', () => {
  it('ignora valores vazios', () => {
    expect(buildQuery({ status: 'active', search: '', priority: undefined })).toBe('?status=active');
  });

  it('devolve string vazia quando não há parâmetros', () => {
    expect(buildQuery({})).toBe('');
  });
});

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devolve o corpo JSON em caso de sucesso', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: 'Projeto' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await apiRequest<{ id: number; name: string }>('/projects/1');

    expect(result).toEqual({ id: 1, name: 'Projeto' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('converte erros da API em ApiError com os campos de validação', async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'Dados inválidos.',
            details: { fields: [{ field: 'name', message: 'Informe o nome do projeto.' }] },
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/projects')).rejects.toBeInstanceOf(ApiError);

    try {
      await apiRequest('/projects');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.status).toBe(400);
      expect(apiError.message).toBe('Dados inválidos.');
      expect(apiError.fields[0]?.field).toBe('name');
    }
  });

  it('não tenta interpretar o corpo em respostas sem conteúdo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/projects/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
