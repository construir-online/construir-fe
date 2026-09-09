"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, type FieldPath, type FieldPathValue } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Loader2, ChevronUp } from "lucide-react";
import { resolveCartProducts } from "@/services/products";
import { ordersService } from "@/services/orders";
import { discountsService } from "@/services/discounts";
import { guestCustomersService } from "@/services/guest-customers";
import { exchangeRateService } from "@/services/exchangeRate";
import { formatVES, formatUSD } from "@/lib/currency";
import { esIdentificacionValidaVE, esTelefonoMovilVE } from "@/lib/venezuela";

import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import Step1ContactInfo, {
  type ContactSubStep,
} from "@/components/checkout/steps/Step1ContactInfo";
import Step2DeliveryMethod from "@/components/checkout/steps/Step2DeliveryMethod";
import Step3Location from "@/components/checkout/steps/Step3Location";
import Step4Payment from "@/components/checkout/steps/Step4Payment";
import OrderSummary from "@/components/checkout/OrderSummary";
import OrderSummarySheet from "@/components/checkout/OrderSummarySheet";
import type {
  CheckoutData,
  Product,
  ZellePayment,
  PagoMovilPayment,
  TransferenciaPayment,
  CreateOrderDto,
  CustomerInfoDto,
  ShippingAddressDto,
  GuestCustomer,
} from "@/types";
import { IdentificationType } from "@/types";
import { PaymentMethod as PaymentMethodEnum } from "@/lib/enums";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { esMetodoHabilitado } from "@/components/checkout/LocationMethodSelector";

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations("checkout");

  const { user } = useAuth();
  const { cart, localCart } = useCart();
  const { methods: activePaymentMethods } = usePaymentMethods();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [locationMethod, setLocationMethod] = useState<
    "manual" | "auto" | "map"
  >("manual");
  const [currentStep, setCurrentStep] = useState(0);
  // El paso de contacto se reparte en dos pantallas: cédula primero, datos después
  const [contactSubStep, setContactSubStep] =
    useState<ContactSubStep>("identification");
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Discount state
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountAmountVes, setDiscountAmountVes] = useState<number | null>(
    null,
  );
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Guest customer identification state
  const [identificationType, setIdentificationType] =
    useState<IdentificationType>(IdentificationType.V);
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [isSearchingGuest, setIsSearchingGuest] = useState(false);
  // Identificación con la que se autocompletó, para el aviso del paso de datos
  const [autofilledGuest, setAutofilledGuest] = useState<{
    label: string;
    ordersCount: number;
  } | null>(null);

  const toast = useToast();

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<CheckoutData>({
    defaultValues: {
      deliveryMethod: "pickup",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Venezuela",
      additionalInfo: "",
      latitude: undefined,
      longitude: undefined,
      createAccount: false,
      password: "",
      paymentMethod: PaymentMethodEnum.ZELLE,
    },
  });

  // Watch para observar cambios en deliveryMethod y otros campos
  const deliveryMethod = watch("deliveryMethod");
  const createAccount = watch("createAccount");
  const paymentMethod = watch("paymentMethod");
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const [zellePayment, setZellePayment] = useState<ZellePayment>({
    senderName: "",
    senderBank: "",
    receipt: null,
  });

  const [pagomovilPayment, setPagomovilPayment] = useState<PagoMovilPayment>({
    phoneNumber: "",
    cedula: "",
    bankCode: "",
    referenceCode: "",
    receipt: null,
  });

  const [transferenciaPayment, setTransferenciaPayment] =
    useState<TransferenciaPayment>({
      accountName: "",
      bankCode: "",
      referenceNumber: "",
      receipt: null,
    });

  const isAuthenticated = !!user;

  /**
   * A quien tiene sesión se le pide la cédula sólo si su cuenta no la tiene.
   *
   * Saltarle la pantalla a todo el que inició sesión dejaba pedidos sin
   * identificación: el checkout no la pedía, la cuenta no la tenía y —en
   * retiro en local— tampoco hay dirección de envío que la lleve, así que al
   * ERP le llegaba vacía. Se pide una vez y el backend la guarda en la cuenta.
   */
  const perfilIncompleto =
    isAuthenticated && (!user?.identificationNumber || !user?.phone);

  const effectiveSubStep: ContactSubStep =
    isAuthenticated && !perfilIncompleto ? "details" : contactSubStep;
  const isOnIdentification =
    currentStep === 0 && effectiveSubStep === "identification";
  // En la primera pantalla el retroceso sale del checkout, no navega entre pasos
  const canGoBack =
    currentStep > 0 ||
    ((!isAuthenticated || perfilIncompleto) && contactSubStep === "details");

  const CHECKOUT_STORAGE_KEY = 'checkout_draft';

  // Restaurar datos guardados al montar
  useEffect(() => {
    const saved = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data.form) reset(data.form);
      // Always start at step 1 so the user can review/modify data, even if it was previously saved
      // Un borrador viejo puede traer un método que hoy está deshabilitado: se
      // descarta y queda el manual, que es el valor inicial.
      if (esMetodoHabilitado(data.locationMethod)) setLocationMethod(data.locationMethod);
      if (data.identificationType) setIdentificationType(data.identificationType);
      if (data.identificationNumber !== undefined) setIdentificationNumber(data.identificationNumber);
      if (data.zellePayment) setZellePayment({ ...data.zellePayment, receipt: null });
      if (data.pagomovilPayment) setPagomovilPayment({ ...data.pagomovilPayment, receipt: null });
      if (data.transferenciaPayment) setTransferenciaPayment({ ...data.transferenciaPayment, receipt: null });
    } catch {
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir datos en sessionStorage cuando cambian
  const allFormValues = watch();
  useEffect(() => {
    sessionStorage.setItem(
      CHECKOUT_STORAGE_KEY,
      JSON.stringify({
        form: allFormValues,
        locationMethod,
        identificationType,
        identificationNumber,
        zellePayment: { ...zellePayment, receipt: null },
        pagomovilPayment: { ...pagomovilPayment, receipt: null },
        transferenciaPayment: { ...transferenciaPayment, receipt: null },
      }),
    );
  }, [allFormValues, currentStep, locationMethod, identificationType, identificationNumber, zellePayment, pagomovilPayment, transferenciaPayment]);

  // Definir los pasos dinámicamente según el método de entrega
  const getSteps = () => {
    const baseSteps = [
      {
        id: 1,
        title: t("stepContact", { defaultValue: "Contacto" }),
        description: t("stepContactDesc", {
          defaultValue: "Información de contacto",
        }),
      },
      {
        id: 2,
        title: t("stepDelivery", { defaultValue: "Entrega" }),
        description: t("stepDeliveryDesc", {
          defaultValue: "Método de entrega",
        }),
      },
    ];

    // Solo agregar paso de ubicación si es delivery
    if (deliveryMethod === "delivery") {
      baseSteps.push({
        id: 3,
        title: t("stepLocation", { defaultValue: "Ubicación" }),
        description: t("stepLocationDesc", {
          defaultValue: "Dirección de envío",
        }),
      });
    }

    baseSteps.push({
      id: baseSteps.length + 1,
      title: t("stepPayment", { defaultValue: "Pago" }),
      description: t("stepPaymentDesc", { defaultValue: "Método de pago" }),
    });

    return baseSteps;
  };

  const steps = getSteps();

  /**
   * Enter desde el teclado hace lo mismo que el botón que el cliente tiene
   * delante: avanzar de paso, y sólo confirmar el pedido en el último.
   *
   * El `<form>` envuelve los cuatro pasos, así que su `onSubmit` —el envío
   * final— se disparaba con Enter en cualquier campo. En el paso de la cédula
   * eso intentaba crear la orden, la validación del último paso fallaba en
   * silencio y no pasaba nada visible: en móvil había que bajar el teclado y
   * tocar el botón a mano.
   */
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (currentStep < steps.length - 1) {
      event.preventDefault();
      handleNext();
      return;
    }

    handleSubmit(onSubmit)(event);
  };

  // Últimos valores heredados por cada forma de pago, para distinguirlos de los
  // que escribió el usuario a mano.
  const seededPagomovil = useRef({ phoneNumber: "", cedula: "" });
  const seededTransferencia = useRef({ accountName: "" });

  /**
   * Pago móvil y transferencia piden datos del emisor que el comprador ya dio en
   * el paso de contacto (cédula, teléfono, titular), así que los heredan al
   * llegar al pago — editables, como cualquier otro campo. Zelle queda fuera: ahí
   * el pago se coordina cuando el encargado contacta al cliente.
   *
   * Se siembra al entrar al paso y no en cada pulsación: si no, el valor se
   * congelaría en la primera letra que se teclea en el contacto.
   *
   * Solo se pisa un campo vacío o uno que siga teniendo el valor heredado; en
   * cuanto el usuario lo edita —porque pagó desde otro titular— manda lo suyo.
   */
  const contactPhone = watch("phone");
  const contactFirstName = watch("firstName");
  const contactLastName = watch("lastName");
  useEffect(() => {
    if (currentStep !== steps.length - 1) return;

    const cedula = identificationNumber
      ? `${identificationType}-${identificationNumber}`
      : "";
    const accountName = `${contactFirstName || ""} ${contactLastName || ""}`.trim();

    setPagomovilPayment((prev) => {
      const seeded = seededPagomovil.current;
      const takePhone =
        !!contactPhone &&
        (!prev.phoneNumber || prev.phoneNumber === seeded.phoneNumber);
      const takeCedula =
        !!cedula && (!prev.cedula || prev.cedula === seeded.cedula);
      if (!takePhone && !takeCedula) return prev;

      if (takePhone) seeded.phoneNumber = contactPhone;
      if (takeCedula) seeded.cedula = cedula;

      return {
        ...prev,
        ...(takePhone ? { phoneNumber: contactPhone } : {}),
        ...(takeCedula ? { cedula } : {}),
      };
    });

    setTransferenciaPayment((prev) => {
      const seeded = seededTransferencia.current;
      const takeName =
        !!accountName &&
        (!prev.accountName || prev.accountName === seeded.accountName);
      if (!takeName) return prev;

      seeded.accountName = accountName;
      return { ...prev, accountName };
    });
  }, [
    currentStep,
    steps.length,
    contactPhone,
    contactFirstName,
    contactLastName,
    identificationType,
    identificationNumber,
  ]);

  // Funciones de navegación
  const handleNext = () => {
    // Validar el paso actual antes de avanzar
    if (isOnIdentification) {
      // La cédula solo abre la pantalla de datos; el autocompletado es un extra
      if (!identificationNumber.trim()) {
        toast.error(
          t("errors.completeIdentification", {
            defaultValue: "Ingresa tu cédula o RIF para continuar",
          }),
        );
        return;
      }

      // Misma regla que el registro (`@/lib/venezuela`), no una copia con otro
      // criterio: antes bastaba con siete caracteres cualesquiera, así que una
      // cédula de tres dígitos o con letras pasaba y el recibo salía con una
      // identificación que no existe. Un RIF (J, G) o un pasaporte (P) siguen
      // aceptándose como antes: tienen otras reglas.
      if (!esIdentificacionValidaVE(identificationType, identificationNumber)) {
        toast.error(
          t("errors.identificationInvalid", {
            defaultValue: "La cédula debe tener 7 u 8 dígitos.",
          }),
        );
        return;
      }

      // Avanzar con Enter no hace `blur` del campo, así que la búsqueda que
      // cuelga de `onBlur` no llegaba a correr: el cliente pasaba de paso con
      // el formulario vacío aunque su cédula tuviera registro. Se dispara acá
      // también; la caché de `handleIdentificationSearch` evita la consulta
      // repetida cuando el `blur` ya la hizo.
      void handleIdentificationSearch();

      setContactSubStep("details");
      return;
    }

    if (currentStep === 0) {
      // Validar contacto
      const firstName = watch("firstName");
      const lastName = watch("lastName");
      const email = watch("email");
      const phone = watch("phone");

      if (!firstName || !lastName || !email || !phone) {
        toast.error(
          t("errors.completeContact", {
            defaultValue: "Por favor completa todos los campos de contacto",
          }),
        );
        return;
      }

      // El teléfono es por donde el despachador coordina la entrega: si no es
      // un móvil venezolano no sirve, y hasta ahora se aceptaba cualquier cosa.
      if (!esTelefonoMovilVE(phone)) {
        toast.error(
          t("errors.phoneInvalid", {
            defaultValue:
              "Escribe un móvil venezolano: 0412, 0414, 0416, 0424 o 0426 + 7 dígitos.",
          }),
        );
        return;
      }
    }

    if (currentStep === 1 && deliveryMethod === "delivery") {
      // Si es delivery, ir al paso de ubicación
      setCurrentStep(2);
      return;
    }

    if (currentStep === 1 && deliveryMethod === "pickup") {
      // Si es pickup, saltar directo a pago
      setCurrentStep(steps.length - 1);
      return;
    }

    if (currentStep === 2 && deliveryMethod === "delivery") {
      // Validar ubicación
      if (locationMethod === "manual") {
        const address = watch("address");
        const city = watch("city");
        const zipCode = watch("zipCode");
        if (!address || !city || !zipCode) {
          toast.error(
            t("errors.completeAddress", {
              defaultValue: "Por favor completa la dirección",
            }),
          );
          return;
        }
      } else {
        if (!latitude || !longitude) {
          toast.error(
            t("errors.selectLocation", {
              defaultValue: "Por favor selecciona tu ubicación",
            }),
          );
          return;
        }
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    if (currentStep === 0) {
      // Dentro del paso de contacto, volver es regresar a la pantalla de cédula
      if (!isAuthenticated && contactSubStep === "details") {
        setContactSubStep("identification");
      }
      return;
    }

    if (currentStep === steps.length - 1 && deliveryMethod === "pickup") {
      // Si estamos en pago y es pickup, volver al paso de método de entrega
      setCurrentStep(1);
      return;
    }

    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  /**
   * Resuelve los productos del carrito de invitado para poder mostrar precios.
   *
   * Va por uuid y no pidiendo una página del catálogo: con
   * `getProducts({ page: 1, limit: 100 })` cualquier producto fuera de los 100
   * más recientes no se encontraba, `enrichedLocalItems` quedaba vacío y la
   * guarda de más abajo devolvía al cliente al carrito — entraba al checkout y
   * rebotaba, con el carrito lleno.
   */
  useEffect(() => {
    const loadLocalCartProducts = async () => {
      try {
        setLoadingProducts(true);
        const { found } = await resolveCartProducts(
          localCart.items.map((item) => item.productUuid),
        );
        setProducts(found);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (!isAuthenticated && localCart.items.length > 0) {
      loadLocalCartProducts();
    } else {
      setLoadingProducts(false);
    }
  }, [isAuthenticated, localCart]);

  // Cargar tipo de cambio
  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        console.log("🔄 Loading exchange rate...");
        const rate = await exchangeRateService.getCurrentRate();
        console.log("✅ Exchange rate loaded:", rate);
        if (rate && typeof rate.rate === "number") {
          setExchangeRate(rate.rate);
          console.log("✅ Exchange rate set:", rate.rate);
        } else {
          console.warn("⚠️ Invalid exchange rate format:", rate);
        }
      } catch (error) {
        console.error("❌ Error loading exchange rate:", error);
        toast.error(
          "No se pudo cargar el tipo de cambio. Los precios en VES no estarán disponibles.",
        );
      }
    };

    loadExchangeRate();
  }, []);

  // Calcular items y subtotal
  const enrichedLocalItems = localCart.items
    .map((item) => {
      const product = products.find((p) => p.uuid === item.productUuid);
      if (!product) return null;
      return {
        productUuid: item.productUuid,
        quantity: item.quantity,
        product,
      };
    })
    .filter(Boolean);

  const items = isAuthenticated ? cart?.items || [] : enrichedLocalItems;

  /**
   * No tiene sentido estar en el checkout sin carrito: el formulario aparece sin
   * nada que comprar. El carrito vacío tiene su propia pantalla, que sí lo
   * explica.
   *
   * Va con margen a propósito, no redirige en cuanto ve `items` vacío: en el
   * primer render `cart` es null y el carrito local todavía no se ha hidratado,
   * así que un chequeo inmediato echaría del checkout a todo el mundo. Si los
   * artículos llegan dentro de la ventana, el efecto se repite y cancela el
   * temporizador.
   *
   * `orderPlaced` cubre el pedido recién creado: el carrito se vacía en la
   * pantalla de confirmación y esta guarda no debe robar esa navegación.
   */
  const orderPlaced = useRef(false);
  useEffect(() => {
    if (loadingProducts || orderPlaced.current || items.length > 0) return;

    const timer = setTimeout(() => {
      if (!orderPlaced.current) router.replace("/carrito");
    }, 1500);

    return () => clearTimeout(timer);
  }, [loadingProducts, items.length, router]);
  const subtotal = isAuthenticated
    ? cart?.subtotal || 0
    : enrichedLocalItems.reduce((acc, item) => {
        if (!item) return acc;
        return acc + item.product.priceWithIva * item.quantity;
      }, 0);

  const subtotalVES = isAuthenticated
    ? cart?.subtotalVes || null
    : enrichedLocalItems.reduce((acc, item) => {
        if (!item) return acc;
        return acc + item.product.priceWithIvaVes * item.quantity;
      }, 0);

  const ivaAmount = isAuthenticated
    ? (cart?.items || []).reduce((acc, item) => {
        return acc + (item.product.priceWithIva - parseFloat(item.product.price)) * item.quantity;
      }, 0)
    : enrichedLocalItems.reduce((acc, item) => {
        if (!item) return acc;
        return acc + (item.product.priceWithIva - parseFloat(item.product.price)) * item.quantity;
      }, 0);

  const ivaAmountVes = isAuthenticated
    ? (cart?.items || []).reduce((acc, item) => {
        return acc + (item.product.ivaVes || 0) * item.quantity;
      }, 0)
    : enrichedLocalItems.reduce((acc, item) => {
        if (!item) return acc;
        return acc + (item.product.ivaVes || 0) * item.quantity;
      }, 0);

  const shipping = 0; // TODO: Calcular envío
  const total = subtotal + shipping - discountAmount;

  // Calcular total VES
  // Si tenemos subtotalVES, calculamos el total
  // Solo necesitamos exchangeRate para convertir shipping y discounts (si existen y son > 0)
  const totalVES =
    subtotalVES !== null && subtotalVES !== undefined
      ? (() => {
          let vesTotal = subtotalVES;

          // Agregar shipping en VES (solo si es > 0 y tenemos exchangeRate)
          if (
            shipping > 0 &&
            exchangeRate &&
            typeof exchangeRate === "number"
          ) {
            vesTotal += shipping * exchangeRate;
          }

          // Restar descuento en VES (usar valor directo del backend, NO convertir)
          if (discountAmountVes !== null && discountAmountVes > 0) {
            vesTotal -= discountAmountVes;
          }

          return vesTotal;
        })()
      : null;

  // Debug logs
  console.log("🔍 Checkout Debug:", {
    subtotal,
    subtotalVES,
    exchangeRate,
    total,
    totalVES,
    discountAmount,
    discountAmountVes,
    paymentMethod,
    isAuthenticated,
    cartSubtotalVes: cart?.subtotalVes,
    itemsCount: items.length,
    firstItemPriceVes: items[0]?.product?.priceVes,
  });

  const handlePaymentMethodChange = (method: PaymentMethodEnum) => {
    setValue("paymentMethod", method);
  };

  const handleApplyDiscount = async (code: string) => {
    setIsApplyingDiscount(true);
    setDiscountError(null);
    try {
      const response = await discountsService.validate({
        code,
        orderTotal: subtotal,
      });
      if (response.valid && response.discount) {
        setDiscountAmount(response.discount.discountAmount);
        setDiscountAmountVes(response.discount.discountAmountVes || null);
        setDiscountCode(code);
        toast.success(t("discountApplied"));
      } else {
        setDiscountAmount(0);
        setDiscountAmountVes(null);
        setDiscountCode(null);
        setDiscountError(response.error || t("errors.invalidDiscount"));
      }
    } catch (error) {
      setDiscountAmount(0);
      setDiscountAmountVes(null);
      setDiscountCode(null);
      if (error instanceof Error) {
        setDiscountError(error.message);
      } else {
        setDiscountError(t("errors.invalidDiscount"));
      }
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  // Actualizar el state sin buscar
  const handleIdentificationChange = (
    type: IdentificationType,
    number: string,
  ) => {
    setIdentificationType(type);
    setIdentificationNumber(number);
    // Cambiar la cédula invalida el autocompletado anterior: no basta con
    // quitar el aviso, hay que sacar del formulario los datos de la otra
    // persona. Si no, una consulta a una cédula ajena seguida de la propia
    // dejaba el pedido con el nombre, correo y dirección del anterior.
    revertGuestData();
  };

  // Resultados ya consultados, para no gastar el límite de tasa del backend
  // (5/min) y para poder reponer el autocompletado sin volver a preguntar
  // cuando el cliente corrige un dígito y vuelve a la cédula original.
  const lookupCache = useRef<Map<string, GuestCustomer | null>>(new Map());

  // Lo que escribió el último autocompletado, para poder deshacerlo.
  const autofilledValues = useRef<Partial<CheckoutData> | null>(null);

  /**
   * Deshace el último autocompletado.
   *
   * Sólo revierte los campos que siguen teniendo exactamente el valor que puso
   * el autocompletado: si el cliente editó alguno a mano después, lo suyo
   * manda y se respeta.
   */
  const revertGuestData = () => {
    const applied = autofilledValues.current;
    autofilledValues.current = null;
    setAutofilledGuest(null);
    if (!applied) return;

    const restore = <K extends FieldPath<CheckoutData>>(
      field: K,
      empty: FieldPathValue<CheckoutData, K>,
    ) => {
      const autofilled = applied[field as keyof CheckoutData];
      if (autofilled === undefined) return;
      if (getValues(field) !== autofilled) return;
      setValue(field, empty);
    };

    restore("firstName", "");
    restore("lastName", "");
    restore("email", "");
    restore("phone", "");
    restore("address", "");
    restore("city", "");
    restore("state", "");
    restore("zipCode", "");
    restore("country", "Venezuela");
    restore("additionalInfo", "");
    restore("latitude", undefined);
    restore("longitude", undefined);
  };

  /** Vuelca sobre el formulario los datos del invitado encontrado. */
  const applyGuestData = (guest: GuestCustomer) => {
    // Un autocompletado reemplaza al anterior por completo.
    revertGuestData();

    const applied: Partial<CheckoutData> = {
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
    };

    setValue("firstName", guest.firstName);
    setValue("lastName", guest.lastName);
    setValue("email", guest.email);
    setValue("phone", guest.phone);

    if (guest.address) {
      setValue("address", guest.address);
      applied.address = guest.address;
    }
    if (guest.city) {
      setValue("city", guest.city);
      applied.city = guest.city;
    }
    if (guest.state) {
      setValue("state", guest.state);
      applied.state = guest.state;
    }
    if (guest.zipCode) {
      setValue("zipCode", guest.zipCode);
      applied.zipCode = guest.zipCode;
    }
    if (guest.country) {
      setValue("country", guest.country);
      applied.country = guest.country;
    }
    if (guest.additionalInfo) {
      setValue("additionalInfo", guest.additionalInfo);
      applied.additionalInfo = guest.additionalInfo;
    }
    if (guest.latitude) {
      setValue("latitude", guest.latitude);
      applied.latitude = guest.latitude;
    }
    if (guest.longitude) {
      setValue("longitude", guest.longitude);
      applied.longitude = guest.longitude;
    }

    autofilledValues.current = applied;

    setAutofilledGuest({
      label: `${guest.identificationType}-${guest.identificationNumber}`,
      ordersCount: guest.ordersCount,
    });
  };

  /**
   * Busca los datos del invitado y autocompleta el formulario si hay registro.
   *
   * Se dispara al salir del campo de identificación, no en cada pulsación: el
   * endpoint público admite 5 consultas por minuto. El aviso "Datos
   * autocompletados · Cambiar" del paso siguiente deja revertirlo.
   */
  const handleIdentificationSearch = async () => {
    if (isAuthenticated) return;
    if (identificationNumber.length < 7) return;

    const lookupKey = `${identificationType}|${identificationNumber}`;

    // Ya consultada: se resuelve con lo cacheado, sin gastar otra petición.
    if (lookupCache.current.has(lookupKey)) {
      const cached = lookupCache.current.get(lookupKey) ?? null;
      if (cached) applyGuestData(cached);
      return;
    }

    setIsSearchingGuest(true);
    try {
      const guestData = await guestCustomersService.searchByIdentification(
        identificationType,
        identificationNumber,
      );
      lookupCache.current.set(lookupKey, guestData);

      // Una cédula sin registro no deja el formulario como estaba: si venía de
      // otro autocompletado, esos datos son de otra persona y hay que sacarlos.
      if (guestData) applyGuestData(guestData);
      else revertGuestData();
    } catch (error) {
      // Un fallo de red no se cachea: se reintenta al próximo blur. Tampoco se
      // revierte nada, porque no sabemos si la cédula tiene registro o no.
      console.error("Error searching guest customer:", error);
    } finally {
      setIsSearchingGuest(false);
    }
  };

  const validatePaymentData = (): boolean => {
    if (paymentMethod === "pagomovil") {
      if (
        !pagomovilPayment.phoneNumber ||
        !pagomovilPayment.cedula ||
        !pagomovilPayment.bankCode ||
        !pagomovilPayment.referenceCode ||
        !pagomovilPayment.receipt
      ) {
        toast.error("Por favor completa todos los campos del Pago Móvil");
        return false;
      }
    } else if (paymentMethod === "transferencia") {
      if (
        !transferenciaPayment.accountName ||
        !transferenciaPayment.bankCode ||
        !transferenciaPayment.referenceNumber ||
        !transferenciaPayment.receipt
      ) {
        toast.error("Por favor completa todos los campos de la Transferencia");
        return false;
      }
    }

    return true;
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue("latitude", position.coords.latitude);
          setValue("longitude", position.coords.longitude);
          // Cambiar automáticamente al método 'map' para mostrar la ubicación
          setLocationMethod("map");
          toast.success(t("locationReceived"));
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("No se pudo obtener la ubicación");
        },
      );
    } else {
      toast.error("Tu navegador no soporta geolocalización");
    }
  };

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setValue("latitude", lat);
    setValue("longitude", lng);
    // No mostrar toast aquí porque se actualiza automáticamente en tiempo real
  };

  const onSubmit = async (formData: CheckoutData) => {
    // El pedido solo se confirma desde el último paso. Blinda contra envíos que
    // no vienen del botón de confirmar: Enter en cualquier campo, o el clic que
    // avanza de paso si el navegador lo resuelve sobre el botón ya reemplazado.
    if (currentStep !== steps.length - 1) return;

    // Validaciones básicas según el método de entrega
    if (formData.deliveryMethod === "delivery") {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.phone
      ) {
        toast.error(t("errors.allFieldsRequired"));
        return;
      }

      // Validar según el método de ubicación
      if (locationMethod === "manual") {
        // Método manual: requiere dirección completa
        if (!formData.address || !formData.city || !formData.zipCode) {
          toast.error(t("errors.addressRequired"));
          return;
        }
      } else {
        // Métodos automático o mapa: requiere coordenadas
        if (!formData.latitude || !formData.longitude) {
          toast.error(
            "Por favor selecciona tu ubicación en el mapa o usa la ubicación automática",
          );
          return;
        }
      }
    }

    if (!isAuthenticated && formData.createAccount && !formData.password) {
      toast.error(t("errors.passwordRequired"));
      return;
    }

    // Validar datos de pago
    if (!validatePaymentData()) {
      return;
    }

    try {
      setLoading(true);

      // Preparar detalles de pago según el método
      let paymentDetails: Record<string, string> = {};
      let receiptFile: File | null = null;

      if (formData.paymentMethod === "zelle") {
        paymentDetails = {};
      } else if (formData.paymentMethod === "pagomovil") {
        paymentDetails = {
          phoneNumber: pagomovilPayment.phoneNumber,
          cedula: pagomovilPayment.cedula,
          bankCode: pagomovilPayment.bankCode,
          referenceCode: pagomovilPayment.referenceCode,
        };
        receiptFile = pagomovilPayment.receipt;
      } else if (formData.paymentMethod === "transferencia") {
        paymentDetails = {
          accountName: transferenciaPayment.accountName,
          transferBankCode: transferenciaPayment.bankCode,
          referenceNumber: transferenciaPayment.referenceNumber,
        };
        receiptFile = transferenciaPayment.receipt;
      }

      // Para invitados, y también para el cliente con sesión cuya cuenta no
      // tenía cédula o teléfono: en ese caso el checkout se los acaba de pedir
      // y el backend los guarda en su cuenta, para no volver a pedírselos.
      const customerInfo: CustomerInfoDto | undefined =
        !isAuthenticated || perfilIncompleto
          ? {
              identificationType: identificationType,
              identificationNumber: identificationNumber,
              firstName: formData.firstName!,
              lastName: formData.lastName!,
              email: formData.email!,
              phone: formData.phone!,
            }
          : undefined;

      // Preparar shippingAddress (solo para delivery)
      const shippingAddress: ShippingAddressDto | undefined =
        formData.deliveryMethod === "delivery"
          ? {
              // Solo incluir dirección completa si es método manual
              ...(locationMethod === "manual"
                ? {
                    address: formData.address!,
                    city: formData.city!,
                    state: formData.state!,
                    zipCode: formData.zipCode!,
                    country: formData.country || "Venezuela",
                  }
                : {
                    // Para métodos automático y mapa, enviar campos vacíos o valores por defecto
                    address: "Coordenadas GPS",
                    city: "Por GPS",
                    state: "Por GPS",
                    zipCode: "0000",
                    country: "Venezuela",
                  }),
              additionalInfo: formData.additionalInfo,
              ...(formData.latitude && formData.longitude
                ? {
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                  }
                : {}),
            }
          : undefined;

      // Preparar DTO para crear orden
      const createOrderDto: CreateOrderDto = {
        deliveryMethod: formData.deliveryMethod,
        customerInfo,
        shippingAddress,
        paymentMethod: formData.paymentMethod,
        paymentDetails,
        // Solo enviar createAccount y password si el usuario quiere crear cuenta
        ...(formData.createAccount && formData.password
          ? {
              createAccount: true,
              password: formData.password,
            }
          : {}),
        // Si es guest, enviar items del carrito local
        ...(!isAuthenticated
          ? {
              items: localCart.items,
            }
          : {}),
        discountCode: discountCode || undefined,
      };

      // Crear la orden
      const order = await ordersService.createOrder(createOrderDto);

      // Subir el comprobante de pago
      if (receiptFile) {
        await ordersService.uploadReceipt(order.uuid, receiptFile);
      }

      // Limpiar datos guardados y redirigir a confirmación.
      // replace y no push: el pedido ya se creó, así que el checkout no debe
      // quedar en el historial. Con push, el botón atrás del teléfono devolvía
      // al formulario con el carrito ya vacío.
      orderPlaced.current = true;
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
      router.replace(`/checkout/confirmacion?method=${formData.paymentMethod}`);
    } catch (error) {
      console.error("Error processing checkout:", error);

      // Mostrar mensaje de error más específico
      let errorMessage = "Error al procesar la orden. Intenta nuevamente.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
    );
  }

  // El precio es dual en toda la app: Bs. protagonista y USD de referencia,
  // independientemente del método de pago que se acabe eligiendo.
  const hasVESTotal =
    totalVES !== null && totalVES !== undefined && totalVES > 0;
  const itemsCount = items.reduce(
    (acc, item) => (item ? acc + item.quantity : acc),
    0,
  );
  const summaryProps = {
    items,
    subtotal,
    subtotalVES,
    ivaAmount,
    ivaAmountVes,
    shipping,
    discountCode,
    discountAmount,
    discountAmountVes,
    total,
    totalVES,
    paymentMethod,
    exchangeRate,
    onApplyDiscount: handleApplyDiscount,
    discountError,
    isApplyingDiscount,
  };

  return (
    <div className="min-h-screen bg-white md:bg-sand-50 md:py-8">
      <div className="mx-auto max-w-7xl px-0 sm:px-6 lg:px-8">
        <h1 className="mb-6 hidden px-4 font-display text-3xl font-bold text-ink md:block md:px-0">
          {t("title")}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-[calc(env(safe-area-inset-bottom)+120px)] lg:pb-0">
          {/* Formulario */}
          <div className="lg:col-span-2">
            {/* Stepper */}
            <div className="sticky top-0 z-20 mb-4 bg-white md:static md:mb-6 md:rounded-2xl md:border md:border-sand-300">
              <CheckoutStepper
                steps={steps}
                currentStep={currentStep}
                onBack={canGoBack ? handlePrevious : () => router.push("/carrito")}
                mobileTitle={
                  currentStep === 0
                    ? isOnIdentification
                      ? t("stepContactIdentification", {
                          defaultValue: "Tus datos",
                        })
                      : t("stepContactConfirm", {
                          defaultValue: "Confirma tus datos",
                        })
                    : undefined
                }
                // La cédula es media pantalla del primer paso, no un paso entero
                progress={
                  isOnIdentification ? (100 / steps.length) * 0.6 : undefined
                }
              />
            </div>

            <form
              id="checkout-form"
              onSubmit={handleFormSubmit}
              className="space-y-6 bg-white p-4 md:rounded-2xl md:border md:border-sand-300 md:p-6"
            >
              {/* Paso 1: Información de Contacto */}
              {currentStep === 0 && (
                <Step1ContactInfo
                  register={register}
                  errors={errors}
                  isAuthenticated={isAuthenticated}
                  subStep={effectiveSubStep}
                  identificationType={identificationType}
                  identificationNumber={identificationNumber}
                  onIdentificationChange={handleIdentificationChange}
                  onIdentificationBlur={handleIdentificationSearch}
                  isSearching={isSearchingGuest}
                  autofilledIdentification={autofilledGuest?.label ?? null}
                  autofilledOrdersCount={autofilledGuest?.ordersCount}
                  onChangeIdentification={() =>
                    setContactSubStep("identification")
                  }
                  createAccount={createAccount || false}
                />
              )}

              {/* Paso 2: Método de Entrega */}
              {currentStep === 1 && (
                <Step2DeliveryMethod
                  deliveryMethod={deliveryMethod}
                  onChange={(method) => setValue("deliveryMethod", method)}
                />
              )}

              {/* Paso 3: Ubicación (solo si es delivery) */}
              {currentStep === 2 && deliveryMethod === "delivery" && (
                <Step3Location
                  register={register}
                  errors={errors}
                  locationMethod={locationMethod}
                  onLocationMethodChange={setLocationMethod}
                  latitude={latitude}
                  longitude={longitude}
                  onGetLocation={handleGetLocation}
                  onMapLocationSelect={handleMapLocationSelect}
                />
              )}

              {/* Paso 4: Pago */}
              {currentStep === steps.length - 1 && (
                <Step4Payment
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={handlePaymentMethodChange}
                  zellePayment={zellePayment}
                  onZelleChange={setZellePayment}
                  pagomovilPayment={pagomovilPayment}
                  onPagomovilChange={setPagomovilPayment}
                  transferenciaPayment={transferenciaPayment}
                  onTransferenciaChange={setTransferenciaPayment}
                  totalUSD={total}
                  totalVES={totalVES}
                  cartItems={items.flatMap((item) => {
                    if (!item) return [];
                    const price =
                      "price" in item
                        ? parseFloat(item.price)
                        : parseFloat(item.product.price);
                    const priceVes =
                      "priceVes" in item && item.priceVes
                        ? parseFloat(item.priceVes)
                        : item.product.priceVes
                          ? parseFloat(item.product.priceVes)
                          : null;
                    return [
                      {
                        productName: item.product.name,
                        quantity: item.quantity,
                        price,
                        priceVes,
                      },
                    ];
                  })}
                  customerName={`${watch("firstName") || ""} ${watch("lastName") || ""}`.trim()}
                  customerPhone={watch("phone") || ""}
                  deliveryMethod={deliveryMethod}
                />
              )}

              {/* Botones de Navegación (desktop/tablet — mobile usa sticky bar) */}
              <div className="hidden justify-between gap-3 border-t border-sand-200 pt-6 md:flex">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={!canGoBack}
                  className="min-h-11 min-w-[110px] rounded-xl border-[1.5px] border-sand-300 px-6 text-sm font-bold text-ink transition-colors hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("previous", { defaultValue: "Anterior" })}
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    key="next-btn"
                    type="button"
                    onClick={handleNext}
                    className="min-h-11 min-w-[110px] rounded-xl bg-brand-600 px-6 text-sm font-bold text-white transition-colors hover:bg-brand-700"
                  >
                    {t("next", { defaultValue: "Siguiente" })}
                  </button>
                ) : activePaymentMethods.length > 0 ? (
                  <button
                    key="submit-btn"
                    type="submit"
                    disabled={loading}
                    className="flex min-h-11 min-w-[110px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t("processing")}
                      </>
                    ) : (
                      t("placeOrder")
                    )}
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          {/* Resumen (sidebar — solo desktop) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <OrderSummary variant="sidebar" {...summaryProps} />
            </div>
          </aside>
        </div>

        {/* Sticky bar mobile con total + CTA */}
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-300 bg-white px-4 pt-3 md:hidden"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)",
            touchAction: "manipulation",
          }}
        >
          <div
            className={`items-center justify-between gap-3 mb-2 ${
              isOnIdentification ? "hidden" : "flex"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsSummaryOpen(true)}
              aria-label={t("orderSummary")}
              aria-expanded={isSummaryOpen}
              aria-controls="order-summary-sheet-title"
              className="-ml-1 flex items-center gap-1 rounded-lg px-1 py-1 text-[12.5px] font-bold text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <ChevronUp className="w-4 h-4" />
              {t("orderSummary")} ({itemsCount})
            </button>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-sand-600">
                {t("total")}
              </div>
              <div
                className="text-[17px] font-extrabold text-ink"
                aria-live="polite"
              >
                {hasVESTotal ? formatVES(totalVES!) : formatUSD(total)}
              </div>
              {hasVESTotal && (
                <div className="text-[11px] font-medium text-sand-600">
                  {formatUSD(total)}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {canGoBack && (
              <button
                type="button"
                onClick={handlePrevious}
                className="min-h-11 w-24 flex-none rounded-xl border-[1.5px] border-sand-300 py-3 text-sm font-bold text-ink transition-colors hover:bg-sand-100"
              >
                {t("previous", { defaultValue: "Atrás" })}
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                key="next-btn"
                type="button"
                onClick={handleNext}
                className="min-h-11 flex-1 rounded-xl bg-brand-600 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-700"
              >
                {t("next", { defaultValue: "Siguiente" })}
              </button>
            ) : activePaymentMethods.length > 0 ? (
              <button
                key="submit-btn"
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("processing")}
                  </>
                ) : (
                  t("placeOrder")
                )}
              </button>
            ) : null}
          </div>
        </div>

        <OrderSummarySheet
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          {...summaryProps}
        />

      </div>
    </div>
  );
}
