import { TestBed } from '@angular/core/testing';

import { SparkChartComponent } from './spark-chart.component';

describe('SparkChartComponent', () => {
  it('shows the latest value and draws a reference line', async () => {
    await TestBed.configureTestingModule({ imports: [SparkChartComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SparkChartComponent);
    fixture.componentRef.setInput('label', 'Speed p95');
    fixture.componentRef.setInput('values', [200, 300, 450]);
    fixture.componentRef.setInput('max', 600);
    fixture.componentRef.setInput('reference', 500);
    fixture.componentRef.setInput('format', (v: number) => `${v} ms`);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.spark__value')?.textContent).toContain('450 ms');
    expect(el.querySelector('.spark__ref')).not.toBeNull();
  });
});
