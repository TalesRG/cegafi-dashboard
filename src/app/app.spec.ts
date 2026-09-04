import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { EdoCampoScrapeResult } from './models/product';

const scrapeResult: EdoCampoScrapeResult = {
  source: 'https://www.edocampo.com.br/queijos',
  scrapedAt: '2026-09-01T12:00:00.000Z',
  total: 2,
  products: [
    {
      id: '1',
      skuId: '10',
      name: 'Queijo Minas Frescal',
      brand: 'Fazenda Boa Vista',
      price: 24.9,
      listPrice: 32.9,
      seller: 'Edocampo',
      imageUrl: null,
      url: 'https://www.edocampo.com.br/queijo-1/p?skuId=10',
      available: true,
    },
    {
      id: '2',
      skuId: '20',
      name: 'Queijo Canastra Meia Cura',
      brand: 'Serra da Canastra',
      price: 79.9,
      listPrice: null,
      seller: 'Parceiro',
      imageUrl: null,
      url: 'https://www.edocampo.com.br/queijo-2/p?skuId=20',
      available: false,
    },
  ],
};

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function render() {
    const fixture = TestBed.createComponent(App);
    httpMock.expectOne('/api/scraper/edocampo').flush(scrapeResult);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza os produtos retornados pelo scraper', async () => {
    const fixture = render();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('CEGAFI');
    expect(compiled.querySelectorAll('.card').length).toBe(2);
  });

  it('filtra por disponibilidade e por busca', async () => {
    const fixture = render();
    const app = fixture.componentInstance as unknown as {
      onlyAvailable: { set(value: boolean): void };
      search: { set(value: string): void };
      filtered: () => unknown[];
      stats: () => { discounted: number };
    };

    app.onlyAvailable.set(true);
    expect(app.filtered().length).toBe(1);
    expect(app.stats().discounted).toBe(1);

    app.onlyAvailable.set(false);
    app.search.set('canastra');
    expect(app.filtered().length).toBe(1);
  });
});
