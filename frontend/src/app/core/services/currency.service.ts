import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private currencySubject = new BehaviorSubject<string>('USD');
  public currency$ = this.currencySubject.asObservable();

  private currencyConfigs: { [key: string]: CurrencyConfig } = {
    'USD': { code: 'USD', symbol: '$', name: 'US Dollar' },
    'EUR': { code: 'EUR', symbol: '€', name: 'Euro' },
    'GBP': { code: 'GBP', symbol: '£', name: 'British Pound' },
    'JPY': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    'INR': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    'CAD': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    'AUD': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    'CHF': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    'CNY': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    'SEK': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    'NOK': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    'MXN': { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    'SGD': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    'HKD': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    'NZD': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }
  };

  constructor(private authService: AuthService) {
    // Initialize currency from user preferences
    this.initializeCurrency();
    
    // Listen for user changes to update currency
    this.authService.currentUser$.subscribe(user => {
      if (user?.preferences?.currency) {
        this.currencySubject.next(user.preferences.currency);
      }
    });
  }

  private initializeCurrency(): void {
    const user = this.authService.currentUserValue;
    if (user?.preferences?.currency) {
      this.currencySubject.next(user.preferences.currency);
    }
  }

  getCurrentCurrency(): string {
    return this.currencySubject.value;
  }

  setCurrency(currency: string): void {
    if (this.currencyConfigs[currency]) {
      this.currencySubject.next(currency);
    }
  }

  getCurrencyConfig(currency?: string): CurrencyConfig {
    const currencyCode = currency || this.getCurrentCurrency();
    return this.currencyConfigs[currencyCode] || this.currencyConfigs['USD'];
  }

  getCurrencySymbol(currency?: string): string {
    return this.getCurrencyConfig(currency).symbol;
  }

  getAllCurrencies(): CurrencyConfig[] {
    return Object.values(this.currencyConfigs);
  }

  formatCurrency(amount: number, currency?: string): string {
    const currencyCode = currency || this.getCurrentCurrency();
    const config = this.getCurrencyConfig(currencyCode);
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback for unsupported currencies
      return `${config.symbol}${amount.toFixed(2)}`;
    }
  }

  formatAmount(amount: number, currency?: string): string {
    const currencyCode = currency || this.getCurrentCurrency();
    const config = this.getCurrencyConfig(currencyCode);
    
    return `${config.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}
