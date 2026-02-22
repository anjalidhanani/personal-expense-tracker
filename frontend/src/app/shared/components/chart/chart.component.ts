import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyService } from '../../../core/services/currency.service';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [class]="containerClass">
      <canvas #chartCanvas [width]="width" [height]="height"></canvas>
      <div class="chart-legend" *ngIf="showLegend && chartData">
        <div class="legend-item" *ngFor="let item of legendItems; let i = index">
          <div class="legend-color" [style.background-color]="item.color"></div>
          <span class="legend-label">{{ item.label }}</span>
          <span class="legend-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .chart-container.pie {
      flex-direction: row;
      align-items: flex-start;
    }

    canvas {
      max-width: 100%;
      height: auto;
    }

    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 200px;
    }

    .chart-container.pie .chart-legend {
      margin-left: 20px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 6px;
      background: var(--background-color, #fafafa);
      transition: all 0.3s ease;
    }

    .legend-item:hover {
      background: var(--hover-color, #f0f0f0);
      transform: translateX(4px);
    }

    :host-context(.dark-theme) .legend-item {
      background: var(--background-color-dark, #333);
    }

    :host-context(.dark-theme) .legend-item:hover {
      background: var(--hover-color-dark, #444);
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      font-weight: 500;
      color: var(--text-primary, #1a1a1a);
    }

    :host-context(.dark-theme) .legend-label {
      color: var(--text-primary-dark, #ffffff);
    }

    .legend-value {
      font-weight: 600;
      color: var(--text-secondary, #666);
    }

    :host-context(.dark-theme) .legend-value {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    @media (max-width: 768px) {
      .chart-container.pie {
        flex-direction: column;
        align-items: center;
      }

      .chart-container.pie .chart-legend {
        margin-left: 0;
        margin-top: 20px;
      }
    }
  `]
})
export class ChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  @Input() chartData: ChartData | null = null;
  @Input() chartType: 'pie' | 'doughnut' | 'bar' | 'line' = 'pie';
  @Input() width = 400;
  @Input() height = 400;
  @Input() showLegend = true;
  @Input() containerClass = '';

  legendItems: { label: string; value: string; color: string }[] = [];
  private chart: any = null;

  constructor(private currencyService: CurrencyService) {}

  ngOnInit(): void {
    this.updateLegendItems();
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && !changes['chartData'].firstChange) {
      this.updateLegendItems();
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private updateLegendItems(): void {
    if (!this.chartData || !this.chartData.datasets.length) {
      this.legendItems = [];
      return;
    }

    const dataset = this.chartData.datasets[0];
    this.legendItems = this.chartData.labels.map((label, index) => ({
      label,
      value: this.formatValue(dataset.data[index]),
      color: dataset.backgroundColor[index] || '#ccc'
    }));
  }

  private formatValue(value: number): string {
    return this.currencyService.formatCurrency(value);
  }

  private renderChart(): void {
    if (!this.chartData || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (this.chartType) {
      case 'pie':
      case 'doughnut':
        this.renderPieChart(ctx, canvas);
        break;
      case 'bar':
        this.renderBarChart(ctx, canvas);
        break;
      case 'line':
        this.renderLineChart(ctx, canvas);
        break;
    }
  }

  private renderPieChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (!this.chartData) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = this.chartType === 'doughnut' ? radius * 0.5 : 0;

    const dataset = this.chartData.datasets[0];
    const total = dataset.data.reduce((sum, value) => sum + value, 0);
    
    let currentAngle = -Math.PI / 2; // Start from top

    dataset.data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const color = dataset.backgroundColor[index] || '#ccc';

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Draw inner circle for doughnut
      if (this.chartType === 'doughnut') {
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-color') || '#ffffff';
        ctx.fill();
      }

      currentAngle += sliceAngle;
    });

    // Add center text for doughnut
    if (this.chartType === 'doughnut') {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1a1a1a';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Total', centerX, centerY - 10);
      ctx.font = '14px Arial';
      ctx.fillText(this.formatValue(total), centerX, centerY + 10);
    }
  }

  private renderBarChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (!this.chartData) return;

    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    const dataset = this.chartData.datasets[0];
    const maxValue = Math.max(...dataset.data);
    const barWidth = chartWidth / dataset.data.length * 0.8;
    const barSpacing = chartWidth / dataset.data.length * 0.2;

    // Draw axes
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#eee';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw bars
    dataset.data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
      const y = canvas.height - padding - barHeight;

      ctx.fillStyle = dataset.backgroundColor[index] || '#2196f3';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value labels
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1a1a1a';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.formatValue(value), x + barWidth / 2, y - 5);

      // Draw category labels
      ctx.save();
      ctx.translate(x + barWidth / 2, canvas.height - padding + 15);
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = 'right';
      ctx.fillText(this.chartData!.labels[index], 0, 0);
      ctx.restore();
    });
  }

  private renderLineChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (!this.chartData) return;

    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    const dataset = this.chartData.datasets[0];
    const maxValue = Math.max(...dataset.data);
    const minValue = Math.min(...dataset.data);
    const valueRange = maxValue - minValue;

    // Draw axes
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#eee';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Calculate points
    const points = dataset.data.map((value, index) => ({
      x: padding + (index / (dataset.data.length - 1)) * chartWidth,
      y: canvas.height - padding - ((value - minValue) / valueRange) * chartHeight
    }));

    // Draw line
    ctx.strokeStyle = dataset.borderColor?.[0] || '#2196f3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    // Draw points
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = dataset.backgroundColor[index] || '#2196f3';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw value labels
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1a1a1a';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.formatValue(dataset.data[index]), point.x, point.y - 10);
    });

    // Draw category labels
    this.chartData.labels.forEach((label, index) => {
      const x = padding + (index / (this.chartData!.labels.length - 1)) * chartWidth;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1a1a1a';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, canvas.height - padding + 20);
    });
  }
}
