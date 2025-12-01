import { Currency } from '../types';

const currencyConfig: Record<Currency, { locale: string, currency: string }> = {
  [Currency.USD]: { locale: 'en-US', currency: 'USD' },
  [Currency.QAR]: { locale: 'en-QA', currency: 'QAR' },
  [Currency.EUR]: { locale: 'de-DE', currency: 'EUR' }
};

export const formatMoney = (amount: number, currency: Currency): string => {
  const config = currencyConfig[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};