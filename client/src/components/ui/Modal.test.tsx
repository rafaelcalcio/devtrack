import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('não renderiza nada quando está fechado', () => {
    render(
      <Modal open={false} title="Janela" onClose={vi.fn()}>
        <p>Conteúdo</p>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza título, conteúdo e rodapé', () => {
    render(
      <Modal open title="Janela" onClose={vi.fn()} footer={<button type="button">Confirmar</button>}>
        <p>Conteúdo</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Janela' })).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
  });

  it('fecha ao pressionar Esc', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open title="Janela" onClose={onClose}>
        <p>Conteúdo</p>
      </Modal>,
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fecha ao clicar no fundo da janela', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open title="Janela" onClose={onClose}>
        <p>Conteúdo</p>
      </Modal>,
    );

    const backdrop = document.querySelector('.modal-backdrop') as HTMLElement;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fecha pelo botão de fechar do cabeçalho', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open title="Janela" onClose={onClose}>
        <p>Conteúdo</p>
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Fechar janela' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
