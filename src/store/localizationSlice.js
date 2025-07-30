import { createSlice } from "@reduxjs/toolkit";

const localizationSlice = createSlice({
  name: "localization",
  initialState: {
    language: "en",
    currency: "USD",
    exchangeRates: {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      CAD: 1.25,
      AUD: 1.35,
      JPY: 110
    },
    translations: {
      en: {
        "search.placeholder": "Search products...",
        "cart.add": "Add to Cart",
        "cart.empty": "Your cart is empty",
        "product.sale": "Sale",
        "checkout.total": "Total",
        "order.confirmed": "Order Confirmed"
      },
      es: {
        "search.placeholder": "Buscar productos...",
        "cart.add": "Agregar al Carrito",
        "cart.empty": "Tu carrito está vacío",
        "product.sale": "Oferta",
        "checkout.total": "Total",
        "order.confirmed": "Pedido Confirmado"
      },
      fr: {
        "search.placeholder": "Rechercher des produits...",
        "cart.add": "Ajouter au Panier",
        "cart.empty": "Votre panier est vide",
        "product.sale": "Solde",
        "checkout.total": "Total",
        "order.confirmed": "Commande Confirmée"
      },
      de: {
        "search.placeholder": "Produkte suchen...",
        "cart.add": "In den Warenkorb",
        "cart.empty": "Ihr Warenkorb ist leer",
        "product.sale": "Angebot",
        "checkout.total": "Gesamt",
        "order.confirmed": "Bestellung Bestätigt"
      }
    }
  },
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setCurrency: (state, action) => {
      state.currency = action.payload;
    },
    updateExchangeRates: (state, action) => {
      state.exchangeRates = { ...state.exchangeRates, ...action.payload };
    }
  }
});

export const { setLanguage, setCurrency, updateExchangeRates } = localizationSlice.actions;

// Selectors
export const selectTranslation = (state, key) => {
  const { language, translations } = state.localization;
  return translations[language]?.[key] || key;
};

export const selectFormattedPrice = (state, price) => {
  const { currency, exchangeRates } = state.localization;
  const convertedPrice = price * (exchangeRates[currency] || 1);
  
  const formatters = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
    GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    CAD: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
    AUD: new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
    JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })
  };
  
  return formatters[currency]?.format(convertedPrice) || `${currency} ${convertedPrice.toFixed(2)}`;
};

export default localizationSlice.reducer;