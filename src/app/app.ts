import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EdoCampoProduct, EdoCampoScrapeResult } from './models/product';
import { ScraperService } from './services/scraper.service';

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'discount' | 'name';

interface BrandSummary {
  name: string;
  count: number;
  share: number;
}

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private static readonly currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  private static readonly number = new Intl.NumberFormat('pt-BR');
  private static readonly dateTime = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  private readonly scraper = inject(ScraperService);

  protected readonly result = signal<EdoCampoScrapeResult | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly brand = signal('');
  protected readonly seller = signal('');
  protected readonly onlyAvailable = signal(false);
  protected readonly onlyDiscounted = signal(false);
  protected readonly sort = signal<SortKey>('relevance');

  private readonly products = computed(() => this.result()?.products ?? []);

  protected readonly brands = computed(() =>
    this.distinct(this.products().map((product) => product.brand)),
  );

  protected readonly sellers = computed(() =>
    this.distinct(this.products().map((product) => product.seller)),
  );

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const brand = this.brand();
    const seller = this.seller();
    const onlyAvailable = this.onlyAvailable();
    const onlyDiscounted = this.onlyDiscounted();

    const matches = this.products().filter((product) => {
      if (brand && product.brand !== brand) {
        return false;
      }
      if (seller && product.seller !== seller) {
        return false;
      }
      if (onlyAvailable && !product.available) {
        return false;
      }
      if (onlyDiscounted && this.discount(product) === null) {
        return false;
      }
      if (!term) {
        return true;
      }

      return [product.name, product.brand, product.seller, product.skuId]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(term));
    });

    return this.sortProducts(matches, this.sort());
  });

  protected readonly stats = computed(() => {
    const products = this.filtered();
    const prices = products
      .map((product) => product.price)
      .filter((price): price is number => price !== null);
    const discounted = products.filter((product) => this.discount(product) !== null);

    return {
      total: products.length,
      available: products.filter((product) => product.available).length,
      averagePrice: prices.length
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : null,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      discounted: discounted.length,
      brands: this.distinct(products.map((product) => product.brand)).length,
      sellers: this.distinct(products.map((product) => product.seller)).length,
    };
  });

  protected readonly topBrands = computed<BrandSummary[]>(() => {
    const products = this.filtered();
    const counts = new Map<string, number>();

    for (const product of products) {
      const name = product.brand ?? 'Sem marca';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    const ranked = Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const highest = ranked[0]?.count ?? 1;

    return ranked.map((entry) => ({
      ...entry,
      share: (entry.count / highest) * 100,
    }));
  });

  protected readonly hasActiveFilters = computed(
    () =>
      Boolean(this.search() || this.brand() || this.seller()) ||
      this.onlyAvailable() ||
      this.onlyDiscounted(),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.scraper.scrapeEdoCampo().subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.describeError(error));
        this.loading.set(false);
      },
    });
  }

  protected clearFilters(): void {
    this.search.set('');
    this.brand.set('');
    this.seller.set('');
    this.onlyAvailable.set(false);
    this.onlyDiscounted.set(false);
  }

  /** Percentual de desconto, ou null quando não há preço de tabela maior. */
  protected discount(product: EdoCampoProduct): number | null {
    if (
      product.price === null ||
      product.listPrice === null ||
      product.listPrice <= product.price
    ) {
      return null;
    }

    return ((product.listPrice - product.price) / product.listPrice) * 100;
  }

  protected initials(product: EdoCampoProduct): string {
    return product.name.slice(0, 2).toUpperCase();
  }

  protected formatCurrency(value: number | null): string {
    return value === null ? '—' : App.currency.format(value);
  }

  protected formatNumber(value: number): string {
    return App.number.format(value);
  }

  protected formatDateTime(value: string | undefined): string {
    return value ? App.dateTime.format(new Date(value)) : '—';
  }

  private sortProducts(products: EdoCampoProduct[], key: SortKey): EdoCampoProduct[] {
    const sorted = [...products];
    const byPrice = (product: EdoCampoProduct, fallback: number) => product.price ?? fallback;

    switch (key) {
      case 'price-asc':
        return sorted.sort((a, b) => byPrice(a, Infinity) - byPrice(b, Infinity));
      case 'price-desc':
        return sorted.sort((a, b) => byPrice(b, -Infinity) - byPrice(a, -Infinity));
      case 'discount':
        return sorted.sort((a, b) => (this.discount(b) ?? -1) - (this.discount(a) ?? -1));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      default:
        return sorted;
    }
  }

  private distinct(values: (string | null)[]): string[] {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort(
      (a, b) => a.localeCompare(b, 'pt-BR'),
    );
  }

  private describeError(error: HttpErrorResponse): string {
    const detail = error.error?.detail ?? error.error?.message;

    if (error.status === 0) {
      return 'Não foi possível falar com a API. Confirme que o scraper está rodando em http://localhost:3000.';
    }

    return detail
      ? `${error.status}: ${detail}`
      : `Falha ao consultar o scraper (HTTP ${error.status}).`;
  }
}
