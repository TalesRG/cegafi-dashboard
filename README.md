# CEGAFI Dashboard

Dashboard Angular para visualizar os produtos coletados pelo scraper
[`scpr-cegafi`](../scpr-cegafi) (`GET /scraper/edocampo`).

## Requisitos

- Node 20+
- O scraper rodando em `http://localhost:3000`

## Como rodar

```bash
# 1) na pasta do scraper
cd ../scpr-cegafi && npm run start:dev

# 2) nesta pasta
npm start
```

Acesse http://localhost:4200.

O `proxy.conf.json` encaminha `/api/*` para `http://localhost:3000`, então não é
preciso habilitar CORS no Nest durante o desenvolvimento. Para apontar para
outro host, edite o `target` desse arquivo.

> A coleta usa Playwright e pode levar dezenas de segundos na primeira chamada —
> o proxy está configurado com timeout de 10 minutos.

## O que o painel mostra

- **Indicadores**: total de produtos, disponíveis, preço médio (com faixa
  mínima/máxima), itens em promoção, marcas e vendedores distintos.
- **Marcas com mais itens**: ranking das 8 marcas com maior número de produtos.
- **Filtros**: busca livre (nome, marca, vendedor ou SKU), marca, vendedor,
  "só disponíveis", "só promoções" e ordenação (preço, desconto, nome).
- **Grade de produtos**: imagem, marca, nome, preço, preço de tabela riscado com
  selo de desconto, vendedor, SKU e link para a loja.

Todos os indicadores e o ranking respeitam os filtros ativos.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm start` | Servidor de desenvolvimento com proxy para a API |
| `npm run build` | Build de produção em `dist/` |
| `npm test` | Testes unitários (Vitest) |

## Estrutura

```
src/app/
├── models/product.ts          # Contrato EdoCampoProduct / EdoCampoScrapeResult
├── services/scraper.service.ts# Chamada HTTP para /api/scraper/edocampo
├── app.ts                     # Estado, filtros e métricas (signals)
├── app.html                   # Layout do dashboard
└── app.scss                   # Estilos (tema claro/escuro automático)
```
