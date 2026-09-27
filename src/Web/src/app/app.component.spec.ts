import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defines a shell for each persona', () => {
    const personas = routes.map((r) => r.path).filter((p) => ['account', 'org', 'platform'].includes(p ?? ''));
    expect(personas).toEqual(['account', 'org', 'platform']);
  });
});
