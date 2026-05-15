const currencies = {
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    GHS: { symbol: '₵', locale: 'en-GH' },
    NGN: { symbol: '₦', locale: 'en-NG' },
    KES: { symbol: 'KSh', locale: 'en-KE' },
    ZAR: { symbol: 'R', locale: 'en-ZA' },
    JPY: { symbol: '¥', locale: 'ja-JP' },
    CAD: { symbol: 'C$', locale: 'en-CA' },
    AUD: { symbol: 'A$', locale: 'en-AU' },
    INR: { symbol: '₹', locale: 'en-IN' },
    CNY: { symbol: '¥', locale: 'zh-CN' },
};

export function formatCurrency(amount, currencyCode = 'USD') {
    if (amount === undefined || amount === null) return '—';
    
    const currency = currencies[currencyCode] || currencies.USD;

    try {
        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency.symbol}${Number(amount).toFixed(2)}`;
    }
}

export function getCurrencySymbol(currencyCode = 'USD') {
    return currencies[currencyCode]?.symbol || '$';
}

export function getUserCurrency() {
    if (typeof window === 'undefined') return 'USD';
    const stored = localStorage.getItem('user');
    if (stored) {
        try {
            return JSON.parse(stored)?.currency || 'USD';
        } catch {
            return 'USD';
        }
    }
    return 'USD';
}

export function getUserCurrencySymbol() {
    return getCurrencySymbol(getUserCurrency());
}

export default formatCurrency;