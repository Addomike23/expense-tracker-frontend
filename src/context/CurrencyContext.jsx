import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';

const CurrencyContext = createContext({
    currency: 'USD',
    symbol: '$',
    setUserCurrency: () => {},
    formatAmount: (amount) => `$${amount}`,
});

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                return JSON.parse(stored)?.currency || 'USD';
            } catch {
                return 'USD';
            }
        }
        return 'USD';
    });

    const [symbol, setSymbol] = useState(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                return JSON.parse(stored)?.currencySymbol || '$';
            } catch {
                return '$';
            }
        }
        return '$';
    });

    const getSymbolForCurrency = (code) => {
        const symbols = {
            USD: '$', EUR: '€', GBP: '£', GHS: '₵', NGN: '₦',
            KES: 'KSh', ZAR: 'R', JPY: '¥', CAD: 'C$', AUD: 'A$',
            INR: '₹', CNY: '¥'
        };
        return symbols[code] || '$';
    };

    // Sync currency from localStorage whenever it changes
    const syncFromStorage = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const user = JSON.parse(stored);
                if (user.currency && user.currency !== currency) {
                    setCurrency(user.currency);
                    setSymbol(user.currencySymbol || getSymbolForCurrency(user.currency));
                }
            } catch {}
        }
    };

    // Load from backend on mount (if token exists)
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return; // No token = skip API call

        const loadUserCurrency = async () => {
            try {
                const response = await getCurrentUser();
                const user = response.data?.user || response.data;
                if (user?.currency) {
                    setCurrency(user.currency);
                    setSymbol(user.currencySymbol || getSymbolForCurrency(user.currency));
                    // Update localStorage with fresh data
                    const stored = JSON.parse(localStorage.getItem('user') || '{}');
                    localStorage.setItem('user', JSON.stringify({
                        ...stored,
                        currency: user.currency,
                        currencySymbol: user.currencySymbol
                    }));
                }
            } catch (err) {
                // Fallback to localStorage
                syncFromStorage();
            }
        };

        loadUserCurrency();
    }, []);

    // Listen for storage changes
    useEffect(() => {
        window.addEventListener('storage', syncFromStorage);
        return () => window.removeEventListener('storage', syncFromStorage);
    }, [currency]);

    const setUserCurrency = (newCurrency) => {
        setCurrency(newCurrency);
        const newSymbol = getSymbolForCurrency(newCurrency);
        setSymbol(newSymbol);
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.currency = newCurrency;
        user.currencySymbol = newSymbol;
        localStorage.setItem('user', JSON.stringify(user));
    };

    const formatAmount = (amount) => {
        if (amount === undefined || amount === null) return '—';
        const localeMap = {
            USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', GHS: 'en-GH',
            NGN: 'en-NG', KES: 'en-KE', ZAR: 'en-ZA', JPY: 'ja-JP',
            CAD: 'en-CA', AUD: 'en-AU', INR: 'en-IN', CNY: 'zh-CN'
        };
        const locale = localeMap[currency] || 'en-US';
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch {
            return `${symbol}${Number(amount).toFixed(2)}`;
        }
    };

    return (
        <CurrencyContext.Provider value={{ currency, symbol, setUserCurrency, formatAmount }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}

export default CurrencyContext;