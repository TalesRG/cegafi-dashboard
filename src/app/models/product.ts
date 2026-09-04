/** Espelha o contrato exposto por GET /scraper/edocampo (scpr-cegafi). */
export interface EdoCampoProduct {
  id: string | null;
  skuId: string;
  name: string;
  brand: string | null;
  price: number | null;
  listPrice: number | null;
  seller: string | null;
  imageUrl: string | null;
  url: string;
  available: boolean;
}

export interface EdoCampoScrapeResult {
  source: string;
  scrapedAt: string;
  total: number;
  products: EdoCampoProduct[];
}
