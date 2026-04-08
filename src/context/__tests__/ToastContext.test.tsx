import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

// Componente auxiliar para probar el contexto
function TestConsumer({ action }: { action: (toast: ReturnType<typeof useToast>) => void }) {
  const toast = useToast();
  return (
    <button
      onClick={() => action(toast)}
      data-testid="trigger"
    >
      Disparar
    </button>
  );
}

function renderWithProvider(action: (toast: ReturnType<typeof useToast>) => void) {
  return render(
    <ToastProvider>
      <TestConsumer action={action} />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastContext', () => {
  it('muestra un toast de tipo success con el mensaje correcto', () => {
    renderWithProvider((toast) => toast.success('Guardado correctamente'));

    act(() => {
      screen.getByTestId('trigger').click();
    });

    expect(screen.getByText('Guardado correctamente')).toBeInTheDocument();
  });

  it('muestra un toast de tipo error con el mensaje correcto', () => {
    renderWithProvider((toast) => toast.error('Error al guardar'));

    act(() => {
      screen.getByTestId('trigger').click();
    });

    expect(screen.getByText('Error al guardar')).toBeInTheDocument();
  });

  it('múltiples toasts se muestran simultáneamente', () => {
    let toastCtx: ReturnType<typeof useToast>;

    function MultiTrigger() {
      toastCtx = useToast();
      return null;
    }

    render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>,
    );

    act(() => {
      toastCtx!.success('Primer mensaje');
      toastCtx!.error('Segundo mensaje');
    });

    expect(screen.getByText('Primer mensaje')).toBeInTheDocument();
    expect(screen.getByText('Segundo mensaje')).toBeInTheDocument();
  });

  it('el toast desaparece después del timeout', () => {
    const DURATION = 3000;
    renderWithProvider((toast) => toast.success('Temporal', DURATION));

    act(() => {
      screen.getByTestId('trigger').click();
    });

    expect(screen.getByText('Temporal')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(DURATION + 500);
    });

    expect(screen.queryByText('Temporal')).not.toBeInTheDocument();
  });

  it('lanza error si useToast se usa fuera del provider', () => {
    function NoProvider() {
      useToast();
      return null;
    }
    // Suprimir el error de consola de React
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<NoProvider />)).toThrow('useToast must be used within a ToastProvider');
    consoleSpy.mockRestore();
  });
});
