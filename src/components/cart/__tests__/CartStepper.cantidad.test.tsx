import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartStepper from '../CartStepper';

/**
 * Selector de cantidad de la ficha de producto.
 *
 * Antes sólo se podía agregar de uno en uno: llevarse diez sacos de cemento
 * eran diez pulsaciones y diez llamadas al carrito. En una tienda de
 * materiales de construcción esa es la compra normal, no la excepción.
 *
 * Lo que se comprueba acá, en este orden de importancia:
 *  1. Que se agrega la cantidad elegida en UNA sola llamada, por el mismo
 *     camino de alta que usa el resto de la app (`addToCart`).
 *  2. Que el inventario manda: no se puede pedir más de lo que hay.
 *  3. Que el importe del botón es el de lo que se va a agregar y no el de una
 *     unidad suelta.
 */

const addToCart = vi.fn();
const getItemQuantity = vi.fn();
const updateQuantity = vi.fn();
const removeFromCart = vi.fn();

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ addToCart, getItemQuantity, updateQuantity, removeFromCart }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  addToCart.mockResolvedValue(undefined);
  // El producto todavía no está en el carrito: es el estado en el que el
  // selector tiene sentido.
  getItemQuantity.mockReturnValue(0);
});

const mas = () => screen.getByLabelText(/Agregar una unidad|No hay más de/);
const menos = () => screen.getByLabelText('Quitar una unidad');
const cantidadVisible = () =>
  screen.getByRole('group', { name: 'Cantidad a agregar' }).textContent;
/**
 * El botón de alta, no el "+" del selector.
 *
 * Los dos llevan "Agregar" en su nombre accesible, así que un `/Agregar/` a
 * secas casa con ambos: el mock de next-intl devuelve la clave cruda
 * (`addToCart`) cuando la ficha no pasa etiqueta, y con el `+` de por medio la
 * consulta era ambigua o apuntaba al control equivocado.
 */
const botonAgregar = () =>
  screen.getByRole('button', { name: /^(Agregar ·|addToCart)/ });

/**
 * `delay: null` quita la espera artificial que `userEvent` mete entre eventos.
 * Sin ella, un caso de tres toques seguidos tarda segundos y se pasaba del
 * tope de 5 s de vitest cuando la máquina estaba ocupada — la prueba fallaba
 * por el reloj, no por el código, que es la peor clase de prueba roja.
 */
const usuario = () => userEvent.setup({ delay: null });

describe('CartStepper con selector de cantidad', () => {
  it('agrega la cantidad elegida en una sola llamada', async () => {
    const user = usuario();
    render(<CartStepper productUuid="uuid-cemento" inventory={50} conSelectorDeCantidad />);

    await user.click(mas());
    await user.click(mas());
    await user.click(mas());
    expect(cantidadVisible()).toContain('4');

    await user.click(botonAgregar());

    await waitFor(() => expect(addToCart).toHaveBeenCalledTimes(1));
    expect(addToCart).toHaveBeenCalledWith('uuid-cemento', 4);
  });

  it('ajustar la cantidad NO toca el carrito', async () => {
    const user = usuario();
    render(<CartStepper productUuid="uuid-cemento" inventory={50} conSelectorDeCantidad />);

    await user.click(mas());
    await user.click(mas());
    await user.click(menos());

    // Ni una llamada: mientras se ajusta, el usuario no ha comprado nada. Ésta
    // es toda la fricción que se viene a quitar — antes cada toque era un
    // viaje de red.
    expect(addToCart).not.toHaveBeenCalled();
    expect(updateQuantity).not.toHaveBeenCalled();
  });

  it('no baja de una unidad', async () => {
    const user = usuario();
    render(<CartStepper productUuid="uuid-cemento" inventory={50} conSelectorDeCantidad />);

    expect(menos()).toBeDisabled();

    await user.click(botonAgregar());
    await waitFor(() => expect(addToCart).toHaveBeenCalledWith('uuid-cemento', 1));
  });

  describe('el inventario manda', () => {
    it('no deja pasar del inventario disponible', async () => {
      const user = usuario();
      render(<CartStepper productUuid="uuid-cabilla" inventory={3} conSelectorDeCantidad />);

      await user.click(mas());
      await user.click(mas());
      expect(cantidadVisible()).toContain('3');

      // El tope se alcanza de verdad: con inventario 3 y tres toques, el
      // cuarto no puede subir a 4.
      expect(mas()).toBeDisabled();
      await user.click(mas()).catch(() => {});
      expect(cantidadVisible()).toContain('3');
    });

    it('agrega como mucho lo que hay', async () => {
      const user = usuario();
      render(<CartStepper productUuid="uuid-cabilla" inventory={2} conSelectorDeCantidad />);

      await user.click(mas());
      await user.click(botonAgregar());

      await waitFor(() => expect(addToCart).toHaveBeenCalledWith('uuid-cabilla', 2));
    });

    it('avisa en el nombre accesible cuando ya no hay más', async () => {
      const user = usuario();
      render(<CartStepper productUuid="uuid-cabilla" inventory={2} conSelectorDeCantidad />);

      await user.click(mas());

      expect(screen.getByLabelText('No hay más de 2 unidades')).toBeDisabled();
    });
  });

  describe('el importe del botón', () => {
    // El precio va en el texto que le pasa la ficha; el stepper sólo le dice
    // qué cantidad hay elegida.
    const etiqueta = (cantidad: number) => `Agregar · Bs. ${1480 * cantidad}`;

    it('acompaña a la cantidad elegida', async () => {
      const user = usuario();
      render(
        <CartStepper
          productUuid="uuid-cemento"
          inventory={50}
          conSelectorDeCantidad
          addLabel={etiqueta}
        />,
      );

      expect(botonAgregar().textContent).toContain('Agregar · Bs. 1480');

      await user.click(mas());
      await user.click(mas());

      expect(botonAgregar().textContent).toContain('Agregar · Bs. 4440');
    });

    it('vuelve a una unidad después de agregar', async () => {
      const user = usuario();
      render(
        <CartStepper
          productUuid="uuid-cemento"
          inventory={50}
          conSelectorDeCantidad
          addLabel={etiqueta}
        />,
      );

      await user.click(mas());
      expect(botonAgregar().textContent).toContain('Agregar · Bs. 2960');
      await user.click(botonAgregar());
      await waitFor(() => expect(addToCart).toHaveBeenCalledWith('uuid-cemento', 2));

      // Si el selector se quedara en 2, el siguiente toque agregaría otros dos
      // sin que nadie lo hubiera pedido.
      await waitFor(() =>
        expect(botonAgregar().textContent).toContain('Agregar · Bs. 1480'),
      );
    });
  });

  describe('sin el selector, el comportamiento de siempre', () => {
    it('el botón agrega una sola unidad y no pinta selector', async () => {
      const user = usuario();
      render(<CartStepper productUuid="uuid-cemento" inventory={50} />);

      expect(screen.queryByRole('group', { name: 'Cantidad a agregar' })).toBeNull();

      await user.click(botonAgregar());
      await waitFor(() => expect(addToCart).toHaveBeenCalledWith('uuid-cemento', 1));
    });

    it('con el producto ya en el carrito manda la cantidad del carrito', async () => {
      getItemQuantity.mockReturnValue(4);
      const user = usuario();
      render(<CartStepper productUuid="uuid-cemento" inventory={50} conSelectorDeCantidad />);

      // Ya en el carrito, el control edita el carrito: una sola fuente de
      // verdad para la cantidad que se va a cobrar.
      expect(screen.getByText('4')).toBeTruthy();

      await user.click(screen.getByLabelText('Disminuir cantidad'));
      await waitFor(() => expect(updateQuantity).toHaveBeenCalledWith('uuid-cemento', 3));
    });
  });
});
