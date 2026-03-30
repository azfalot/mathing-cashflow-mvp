# Fuentes de datos consultadas para seeds locales

Estas fuentes se usaron para enriquecer `ExternalSignal` durante la seed local. El script intenta consultar la pagina oficial y extraer titulo, fecha y una descripcion base; si falla la consulta, usa un fallback coherente con el contenido oficial ya revisado.

## Fuentes oficiales

1. ECB Data Portal
   - URL: https://data.ecb.europa.eu/key-figures/ecb-interest-rates-and-exchange-rates/key-ecb-interest-rates
   - Uso: tipos oficiales del BCE para contextualizar coste de financiacion y tension de caja.

2. Eurostat News
   - URL: https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20250224-1
   - Uso: tendencia de quiebras empresariales y altas de empresas para estimar deterioro o resiliencia sectorial.
   - Dataset citado por Eurostat: `sts_rb_q`

3. Eurostat Euro indicators
   - URL: https://ec.europa.eu/eurostat/web/products-euro-indicators/w/4-03102024-ap
   - Uso: precios industriales para modelar presion en proveedores y costes de operaciones.
   - Dataset citado por Eurostat: `sts_inppd_m`

## Como se usa en la app

- Se guardan en la tabla `ExternalSignal`.
- El dashboard local muestra estas senales en la seccion "Senales externas".
- Los casos demo por sector se han configurado para que estas senales sean coherentes con sus curvas de caja.
