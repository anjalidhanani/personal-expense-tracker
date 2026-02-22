import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('light');
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Always set light theme
    this.setTheme('light');
  }

  getCurrentTheme(): Theme {
    return 'light';
  }

  setTheme(theme: Theme): void {
    // Only accept light theme
    this.themeSubject.next('light');
    this.applyTheme('light');
    localStorage.setItem('expense-tracker-theme', 'light');
  }

  toggleTheme(): void {
    // No-op - only light theme supported
  }

  private applyTheme(theme: Theme): void {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('light-theme', 'dark-theme');
    
    // Add light theme class
    body.classList.add('light-theme');
  }

  isDarkTheme(): boolean {
    return false;
  }

  isLightTheme(): boolean {
    return true;
  }
}
