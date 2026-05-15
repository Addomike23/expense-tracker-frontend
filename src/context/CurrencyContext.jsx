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

    const [symbol, setSymbol] = useState('$');

    useEffect(() => {
        loadUserCurrency();
    }, []);

    const loadUserCurrency = async () => {
        try {
            const response = await getCurrentUser();
            const user = response.data?.user || response.data;
            if (user?.currency) {
                setCurrency(user.currency);
                setSymbol(getSymbolForCurrency(user.currency));
                localStorage.setItem('user', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('user') || '{}'),
                    currency: user.currency,
                    currencySymbol: user.currencySymbol
                }));
            }
        } catch (err) {
            // Use localStorage fallback
        }
    };

    const getSymbolForCurrency = (code) => {
        const symbols = {
            USD: '$', EUR: '€', GBP: '£', GHS: '₵', NGN: '₦',
            KES: 'KSh', ZAR: 'R', JPY: '¥', CAD: 'C$', AUD: 'A$',
            INR: '₹', CNY: '¥'
        };
        return symbols[code] || '$';
    };

    const setUserCurrency = (newCurrency) => {
        setCurrency(newCurrency);
        setSymbol(getSymbolForCurrency(newCurrency));
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.currency = newCurrency;
        user.currencySymbol = getSymbolForCurrency(newCurrency);
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