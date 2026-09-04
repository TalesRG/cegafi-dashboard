import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EdoCampoScrapeResult } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ScraperService {
  private readonly http = inject(HttpClient);

  /** O proxy de desenvolvimento encaminha /api para o Nest em localhost:3000. */
  scrapeEdoCampo(): Observable<EdoCampoScrapeResult> {
    return this.http.get<EdoCampoScrapeResult>('/api/scraper/edocampo');
  }
}
