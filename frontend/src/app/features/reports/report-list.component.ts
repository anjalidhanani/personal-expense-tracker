import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { ReportService, Report } from '../../core/services/report.service';
import { PdfExportService } from '../../core/services/pdf-export.service';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatBadgeModule,
    MatDividerModule
  ],
  template: `
    <div class="report-list-container">
      <div class="header">
        <h1>Reports & Analytics</h1>
        <div class="header-actions">
          <button mat-stroked-button (click)="openQuickReport()" class="btn-with-icon">
            <mat-icon>flash_on</mat-icon>
            Quick Report
          </button>
          <button mat-raised-button color="primary" (click)="openReportForm()" class="btn-with-icon">
            <mat-icon>add</mat-icon>
            Create Report
          </button>
        </div>
      </div>

      <div class="filter-chips" *ngIf="reports.length > 0">
        <mat-chip-listbox>
          <mat-chip-option 
            [selected]="selectedType === 'all'" 
            (click)="filterByType('all')">
            All Reports
          </mat-chip-option>
          <mat-chip-option 
            [selected]="selectedType === 'expense_summary'" 
            (click)="filterByType('expense_summary')">
            Expense Summary
          </mat-chip-option>
          <mat-chip-option 
            [selected]="selectedType === 'category_breakdown'" 
            (click)="filterByType('category_breakdown')">
            Category Breakdown
          </mat-chip-option>
          <mat-chip-option 
            [selected]="selectedType === 'monthly_trends'" 
            (click)="filterByType('monthly_trends')">
            Monthly Trends
          </mat-chip-option>
          <mat-chip-option 
            [selected]="selectedType === 'budget_analysis'" 
            (click)="filterByType('budget_analysis')">
            Budget Analysis
          </mat-chip-option>
        </mat-chip-listbox>
      </div>

      <div class="report-grid" *ngIf="filteredReports.length > 0; else noReports">
        <mat-card *ngFor="let report of filteredReports" class="report-card">
          <mat-card-header>
            <div mat-card-avatar class="report-avatar">
              <mat-icon>{{ getReportTypeIcon(report.type) }}</mat-icon>
            </div>
            <mat-card-title>
              {{ report.name }}
              <mat-icon 
                *ngIf="report.isFavorite" 
                class="favorite-icon"
                matBadge="★"
                matBadgeColor="accent">
              </mat-icon>
            </mat-card-title>
            <mat-card-subtitle>
              {{ getReportTypeDisplayName(report.type) }}
            </mat-card-subtitle>
            <div class="card-actions">
              <button mat-icon-button [matMenuTriggerFor]="reportMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #reportMenu="matMenu">
                <button mat-menu-item (click)="generateReport(report)" class="menu-item-with-icon">
                  <mat-icon>refresh</mat-icon>
                  Generate
                </button>
                <button mat-menu-item (click)="editReport(report)" class="menu-item-with-icon">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-menu-item (click)="toggleFavorite(report)" class="menu-item-with-icon">
                  <mat-icon>{{ report.isFavorite ? 'star' : 'star_border' }}</mat-icon>
                  {{ report.isFavorite ? 'Remove from Favorites' : 'Add to Favorites' }}
                </button>
                <button mat-menu-item (click)="toggleSchedule(report)" class="menu-item-with-icon">
                  <mat-icon>{{ report.isScheduled ? 'schedule' : 'schedule' }}</mat-icon>
                  {{ report.isScheduled ? 'Unschedule' : 'Schedule' }}
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="exportReportAsPdf(report)" class="menu-item-with-icon">
                  <mat-icon>picture_as_pdf</mat-icon>
                  Export PDF
                </button>
                <button mat-menu-item (click)="exportReport(report, 'csv')" class="menu-item-with-icon">
                  <mat-icon>file_download</mat-icon>
                  Export CSV
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="deleteReport(report)" class="delete-action menu-item-with-icon">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </mat-menu>
            </div>
          </mat-card-header>

          <mat-card-content>
            <div class="report-info">
              <div class="info-item info-item-with-icon">
                <mat-icon class="info-icon">date_range</mat-icon>
                <span>{{ formatDate(report.dateRange.startDate) }} - {{ formatDate(report.dateRange.endDate) }}</span>
              </div>
              
              <div class="info-item info-item-with-icon">
                <mat-icon class="info-icon">bar_chart</mat-icon>
                <span>{{ getChartTypeDisplayName(report.chartType) }}</span>
              </div>

              <div class="info-item info-item-with-icon" *ngIf="report.isScheduled">
                <mat-icon class="info-icon">schedule</mat-icon>
                <span>{{ getScheduleFrequencyDisplayName(report.scheduleFrequency!) }}</span>
              </div>
            </div>

            <div class="report-description" *ngIf="report.description">
              <p>{{ report.description }}</p>
            </div>

            <div class="report-status">
              <mat-chip 
                [style.background-color]="getReportStatusColor(report.status || 'never_generated')"
                [style.color]="'white'"
                class="chip-with-icon">
                <mat-icon matChipAvatar>
                  {{ getReportStatusIcon(report.status || 'never_generated') }}
                </mat-icon>
                {{ getReportStatusText(report.status || 'never_generated') }}
              </mat-chip>
            </div>

            <div class="report-stats" *ngIf="report.lastGenerated">
              <div class="stat">
                <span class="stat-label">Last Generated:</span>
                <span class="stat-value">{{ formatDate(report.lastGenerated) }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Generated:</span>
                <span class="stat-value">{{ report.generationCount }} times</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button (click)="generateReport(report)" class="btn-with-icon">
              <mat-icon>play_arrow</mat-icon>
              Generate
            </button>
            <button mat-button (click)="viewReport(report)" [disabled]="!report.reportData" class="btn-with-icon">
              <mat-icon>visibility</mat-icon>
              View
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <ng-template #noReports>
        <div class="empty-state">
          <mat-icon class="empty-icon">assessment</mat-icon>
          <h2>No Reports Found</h2>
          <p>Create your first report to analyze your expense data and gain insights.</p>
          <div class="empty-actions">
            <button mat-stroked-button (click)="openQuickReport()" class="btn-with-icon">
              <mat-icon>flash_on</mat-icon>
              Quick Report
            </button>
            <button mat-raised-button color="primary" (click)="openReportForm()" class="btn-with-icon">
              <mat-icon>add</mat-icon>
              Create Report
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .report-list-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      background: var(--background-color, #ffffff);
      color: var(--text-color, #000000);
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .report-list-container {
      background: var(--background-color-dark, #121212);
      color: var(--text-color-dark, #ffffff);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header h1 {
      margin: 0;
      color: var(--text-primary, #333);
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .header h1 {
      color: var(--text-primary-dark, #ffffff);
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .filter-chips {
      margin-bottom: 20px;
    }

    .report-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .report-card {
      position: relative;
      background: var(--surface-color, #ffffff);
      color: var(--text-color, #000000);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .report-card {
      background: var(--surface-color-dark, #1e1e1e);
      color: var(--text-color-dark, #ffffff);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .report-card mat-card-header {
      position: relative;
    }

    .card-actions {
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .report-avatar {
      background-color: var(--primary-color, #2196F3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.3s ease;
    }

    :host-context(.dark-theme) .report-avatar {
      background-color: var(--primary-color-dark, #7c4dff);
    }

    .favorite-icon {
      color: #FFD700;
      font-size: 16px;
      margin-left: 8px;
    }

    .report-info {
      margin: 16px 0;
    }

    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .info-item {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
      color: var(--text-tertiary, #999);
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .info-icon {
      color: var(--text-tertiary-dark, rgba(255, 255, 255, 0.5));
    }

    .report-description {
      margin: 12px 0;
    }

    .report-description p {
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
      margin: 0;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .report-description p {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .report-status {
      margin: 16px 0;
    }

    .report-stats {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color, #eee);
      transition: border-color 0.3s ease;
    }

    :host-context(.dark-theme) .report-stats {
      border-top: 1px solid var(--border-color-dark, rgba(255, 255, 255, 0.1));
    }

    .stat {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 0.875rem;
    }

    .stat-label {
      color: var(--text-secondary, #666);
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .stat-label {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .stat-value {
      color: var(--text-primary, #333);
      font-weight: 500;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .stat-value {
      color: var(--text-primary-dark, #ffffff);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-disabled, #ccc);
      margin-bottom: 16px;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .empty-icon {
      color: var(--text-disabled-dark, rgba(255, 255, 255, 0.3));
    }

    .empty-state h2 {
      color: var(--text-secondary, #666);
      margin-bottom: 8px;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .empty-state h2 {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .empty-state p {
      color: var(--text-tertiary, #999);
      margin-bottom: 24px;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .empty-state p {
      color: var(--text-tertiary-dark, rgba(255, 255, 255, 0.5));
    }

    .empty-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .delete-action {
      color: #F44336;
    }

    /* Material Design component overrides for dark theme */
    :host-context(.dark-theme) ::ng-deep .mat-mdc-card {
      background: var(--surface-color-dark, #1e1e1e);
      color: var(--text-color-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-card-title {
      color: var(--text-primary-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-card-subtitle {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-chip {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-chip.mat-mdc-chip-selected {
      background: var(--primary-color-dark, #7c4dff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-divider {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
      .report-grid {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
      }

      .empty-actions {
        flex-direction: column;
        align-items: center;
      }

      .report-list-container {
        padding: 16px;
      }
    }
  `]
})
export class ReportListComponent implements OnInit {
  reports: Report[] = [];
  filteredReports: Report[] = [];
  selectedType: string = 'all';
  loading = true;

  constructor(
    private reportService: ReportService,
    private pdfExportService: PdfExportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.reportService.getReports().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.reports = response.data;
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.snackBar.open('Failed to load reports', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  filterByType(type: string): void {
    this.selectedType = type;
    this.applyFilters();
  }

  applyFilters(): void {
    if (this.selectedType === 'all') {
      this.filteredReports = [...this.reports];
    } else {
      this.filteredReports = this.reports.filter(report => report.type === this.selectedType);
    }
  }

  openReportForm(report?: Report): void {
    // Import ReportFormComponent dynamically to avoid circular dependencies
    import('./report-form.component').then(({ ReportFormComponent }) => {
      const dialogRef = this.dialog.open(ReportFormComponent, {
        width: '800px',
        maxHeight: '90vh',
        data: report || null
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadReports();
        }
      });
    });
  }

  openQuickReport(): void {
    // This would open a quick report dialog
    this.snackBar.open('Quick report feature coming soon!', 'Close', { duration: 3000 });
  }

  editReport(report: Report): void {
    this.openReportForm(report);
  }

  generateReport(report: Report): void {
    this.reportService.generateReport(report._id!).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Report generated successfully', 'Close', { duration: 3000 });
          this.loadReports();
        }
      },
      error: (error) => {
        console.error('Error generating report:', error);
        this.snackBar.open('Failed to generate report', 'Close', { duration: 3000 });
      }
    });
  }

  viewReport(report: Report): void {
    // This would navigate to a report view component
    this.snackBar.open('Report viewer coming soon!', 'Close', { duration: 3000 });
  }

  toggleFavorite(report: Report): void {
    this.reportService.toggleFavorite(report._id!).subscribe({
      next: (response) => {
        if (response.success) {
          report.isFavorite = !report.isFavorite;
          this.snackBar.open(
            `Report ${report.isFavorite ? 'added to' : 'removed from'} favorites`,
            'Close',
            { duration: 3000 }
          );
        }
      },
      error: (error) => {
        console.error('Error toggling favorite:', error);
        this.snackBar.open('Failed to update favorite status', 'Close', { duration: 3000 });
      }
    });
  }

  toggleSchedule(report: Report): void {
    // This would open a schedule dialog
    this.snackBar.open('Report scheduling feature coming soon!', 'Close', { duration: 3000 });
  }

  async exportReportAsPdf(report: Report): Promise<void> {
    if (!report.reportData) {
      this.snackBar.open('Please generate the report first', 'Close', { duration: 3000 });
      return;
    }

    try {
      this.snackBar.open('Generating PDF...', '', { duration: 2000 });
      
      await this.pdfExportService.loadPdfLibraries();
      await this.pdfExportService.exportCustomReportToPdf(report.reportData);
      
      this.snackBar.open('PDF exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.snackBar.open('Failed to export PDF', 'Close', { duration: 3000 });
    }
  }

  exportReport(report: Report, format: 'csv' | 'json'): void {
    if (!report.reportData) {
      this.snackBar.open('Please generate the report first', 'Close', { duration: 3000 });
      return;
    }
    
    this.reportService.exportReportData(report, format);
    this.snackBar.open(`Report exported as ${format.toUpperCase()}`, 'Close', { duration: 3000 });
  }

  deleteReport(report: Report): void {
    if (confirm(`Are you sure you want to delete the report "${report.name}"?`)) {
      this.reportService.deleteReport(report._id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadReports();
            this.snackBar.open('Report deleted successfully', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting report:', error);
          this.snackBar.open('Failed to delete report', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Helper methods
  formatDate(date: Date | string): string {
    return this.reportService.formatDate(date);
  }

  getReportTypeDisplayName(type: string): string {
    return this.reportService.getReportTypeDisplayName(type);
  }

  getChartTypeDisplayName(chartType: string): string {
    return this.reportService.getChartTypeDisplayName(chartType);
  }

  getScheduleFrequencyDisplayName(frequency: string): string {
    return this.reportService.getScheduleFrequencyDisplayName(frequency);
  }

  getReportStatusColor(status: string): string {
    return this.reportService.getReportStatusColor(status);
  }

  getReportStatusIcon(status: string): string {
    return this.reportService.getReportStatusIcon(status);
  }

  getReportStatusText(status: string): string {
    switch (status) {
      case 'never_generated': return 'Not Generated';
      case 'fresh': return 'Fresh';
      case 'recent': return 'Recent';
      case 'stale': return 'Stale';
      default: return 'Unknown';
    }
  }

  getReportTypeIcon(type: string): string {
    switch (type) {
      case 'expense_summary': return 'summarize';
      case 'category_breakdown': return 'pie_chart';
      case 'monthly_trends': return 'trending_up';
      case 'budget_analysis': return 'account_balance_wallet';
      case 'custom': return 'tune';
      default: return 'assessment';
    }
  }
}
