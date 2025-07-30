class LocalizationService {
  constructor() {
    this.supportedLanguages = [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' }
    ];

    this.supportedCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }
    ];
  }

  async delay(ms = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getExchangeRates(baseCurrency = 'USD') {
    await this.delay();
    // Mock exchange rates - in real app would fetch from API
    const rates = {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      CAD: 1.25,
      AUD: 1.35,
      JPY: 110.25,
      KRW: 1180.50,
      CNY: 6.45
    };

    if (baseCurrency !== 'USD') {
      const baseRate = rates[baseCurrency];
      const convertedRates = {};
      Object.entries(rates).forEach(([currency, rate]) => {
        convertedRates[currency] = rate / baseRate;
      });
      return convertedRates;
    }

    return rates;
  }

  convertPrice(price, fromCurrency, toCurrency, exchangeRates) {
    if (fromCurrency === toCurrency) return price;
    
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    
    // Convert to USD first, then to target currency
    const usdPrice = price / fromRate;
    return usdPrice * toRate;
  }

  formatPrice(price, currency = 'USD', locale = 'en-US') {
    const formatters = {
      'en-US': { currency: 'USD', locale: 'en-US' },
      'en-GB': { currency: 'GBP', locale: 'en-GB' },
      'de-DE': { currency: 'EUR', locale: 'de-DE' },
      'fr-FR': { currency: 'EUR', locale: 'fr-FR' },
      'es-ES': { currency: 'EUR', locale: 'es-ES' },
      'it-IT': { currency: 'EUR', locale: 'it-IT' },
      'pt-PT': { currency: 'EUR', locale: 'pt-PT' },
      'ja-JP': { currency: 'JPY', locale: 'ja-JP' },
      'ko-KR': { currency: 'KRW', locale: 'ko-KR' },
      'zh-CN': { currency: 'CNY', locale: 'zh-CN' },
      'en-CA': { currency: 'CAD', locale: 'en-CA' },
      'en-AU': { currency: 'AUD', locale: 'en-AU' }
    };

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2
      }).format(price);
    } catch (error) {
      // Fallback formatting
      const currencySymbol = this.supportedCurrencies.find(c => c.code === currency)?.symbol || currency;
      return `${currencySymbol}${price.toFixed(2)}`;
    }
  }

  async translateText(text, targetLanguage = 'en') {
    await this.delay();
    
    // Mock translation service - in real app would use Google Translate, DeepL, etc.
    const mockTranslations = {
      'Search products...': {
        es: 'Buscar productos...',
        fr: 'Rechercher des produits...',
        de: 'Produkte suchen...',
        it: 'Cerca prodotti...',
        pt: 'Pesquisar produtos...',
        ja: '商品を検索...',
        ko: '제품 검색...'
      },
      'Add to Cart': {
        es: 'Agregar al Carrito',
        fr: 'Ajouter au Panier',
        de: 'In den Warenkorb',
        it: 'Aggiungi al Carrello',
        pt: 'Adicionar ao Carrinho',
        ja: 'カートに追加',
        ko: '장바구니에 추가'
      },
      'Free Shipping': {
        es: 'Envío Gratis',
        fr: 'Livraison Gratuite',
        de: 'Kostenloser Versand',
        it: 'Spedizione Gratuita',
        pt: 'Frete Grátis',
        ja: '送料無料',
        ko: '무료배송'
      }
    };

    return mockTranslations[text]?.[targetLanguage] || text;
  }

  getLanguageByCode(code) {
    return this.supportedLanguages.find(lang => lang.code === code);
  }

  getCurrencyByCode(code) {
    return this.supportedCurrencies.find(curr => curr.code === code);
  }

  async detectUserLocation() {
    await this.delay();
    
    // Mock location detection - in real app would use IP geolocation
    return {
      country: 'US',
      currency: 'USD',
      language: 'en',
      timezone: 'America/New_York'
    };
  }

  getLocaleFromLanguage(languageCode) {
    const localeMap = {
      'en': 'en-US',
      'es': 'es-ES', 
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ja': 'ja-JP',
      'ko': 'ko-KR'
    };
    
    return localeMap[languageCode] || 'en-US';
  }
}

export const localizationService = new LocalizationService();