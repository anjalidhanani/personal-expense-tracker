import { Routes } from '@angular/router';

export const expenseRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./expense-list/expense-list.component').then(m => m.ExpenseListComponent)
  },
  {
    path: 'add',
    loadComponent: () => import('./expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
  }
];
