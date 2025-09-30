/* eslint-disable prettier/prettier */
/* eslint-disable no-unsafe-finally */
import { CheerioCrawler, Configuration } from 'crawlee';
/* eslint-disable @typescript-eslint/no-explicit-any */

const config = Configuration.getGlobalConfig();
config.set('persistStorage', false);
let pageCount = 1;
const detailLinks = [] as string[];
const urls = [] as string[];
const results = [] as any[];

// Create async function to initialize crawlers
async function initializeCrawlers() {

    const summaryCrawler = new CheerioCrawler({
        maxRequestsPerMinute: 15,
        sameDomainDelaySecs: 3,
        statisticsOptions: {},
        async requestHandler({ $, request, log }) {
            log.info(`Scraping URL: ${request.url}`);
            const ilanText = $('div').toArray().map(d => {
                const text = $(d).text().trim();
                return /^\d+\s*ürün$/.test(text) ? text : null;
            }).filter(Boolean)[0] || '';
            const ilanCount = parseInt(ilanText.replace(/\D/g, ''), 10);
            pageCount = Math.ceil(ilanCount / 36);
            console.log(`Toplam ilan sayısı: ${ilanCount}, Sayfa: ${pageCount}`);
            const linkElements = $('[class^="productListContent"] li article a[href]').toArray()
                .map(el => $(el).attr('href'))
                .filter(href => href && !href.includes('adservice'));
            const baseUrl = 'https://www.hepsiburada.com';
            const links = linkElements.map(href => href!.startsWith('http') ? href! : baseUrl + href);

            log.info(`Found links: ${links.length}`);
            detailLinks.push(...links);
        },
    });

    const listCrawler = new CheerioCrawler({
        maxRequestsPerMinute: 15,
        sameDomainDelaySecs: 3,
        statisticsOptions: {},
        async requestHandler({ $, log }) {
            const linkElements = $('[class^="productListContent"] li article a[href]').toArray()
                .map(el => $(el).attr('href'))
                .filter(href => href && !href.includes('adservice'));
            const baseUrl = 'https://www.hepsiburada.com';
            const links = linkElements.map(href => href!.startsWith('http') ? href! : baseUrl + href);

            log.info(`Found links: ${links.length}`);
            detailLinks.push(...links);
        },
    });

    const detailCrawler = new CheerioCrawler({
        maxRequestsPerMinute: 15,

        async requestHandler({ $, request, log }) {
            log.info(`Scraping detail URL: ${request.url}`);

            const rawJson = $('#reduxStore').html();
            if (!rawJson) {
                log.warning(`reduxStore script not found: ${request.url}`);
                throw new Error('reduxStore script not found');
            }
            const parsed = JSON.parse(rawJson);
            const productState = parsed['product'] || parsed['PDP'] || parsed['productDetail'] || parsed;
            let product: any = productState;
            if (productState && productState.productState) {
                product = productState.productState;
            }

            const title = product?.product?.name || product?.title || '';
            const barcode = product.product.barcode || '';
            const brand = product.product.brand || '';
            const categories = product.product.categories || [];
            const category = categories.length > 0 ? categories[categories.length - 1].categoryName : undefined;
            const categoryHierarchy = categories.map((c: any) => c.categoryName).join(' > ') || '';
            const description = $('.productDescriptionContent').html()?.trim() || '';
            const groupId = product?.product?.productId || '';
            const sku = product.product.sku || '';
            const price = product?.product?.prices
                ? Math.min(...product.product.prices.map((p: any) => Number(p.value)))
                : undefined;
            const color = product.activeVariant?.values?.Renk || '';
            const expGroup = product?.product?.expends?.find((a: any) => a?.groupName === '');

            const attributes = expGroup
                ? expGroup.properties.reduce((acc: any, p: any) => {
                    const keyName = p.name;
                    const valueName = p.property;
                    acc[keyName] = valueName;
                    return acc;
                }, {})
                : {};
            let images: string[] = [];
            if (product?.product.media && Array.isArray(product.product.media)) {
                images = product.product.media
                    .map((m: any) => {
                        if (m?.url && m?.maxZoomSize) {
                            return m.url.replace('{size}', m.maxZoomSize);
                        }
                        return null;
                    })
                    .filter(Boolean);
            }
            let sizes: any[] = [];

            if (product?.variants?.Beden) {
                sizes = product.variants.Beden.properties.map((v: any) => ({
                    beden: v.value,
                    inStock: v.isInStock ? 'Stokta Var' : 'Stokta Yok',
                    barcode: v.sku
                }));
            } else if (product?.variants) {
                sizes = Object.values(product.variants)
                    .flatMap((variantGroup: any) =>
                        variantGroup.properties.map((p: any) => ({
                            beden: p.name + ' - ' + p.value,
                            inStock: p.isInStock ? 'Stokta Var' : 'Stokta Yok',
                            barcode: p.sku
                        }))
                    );
            }

            const scrapedData = {
                url: request.url,
                groupId: groupId,
                details: {
                    isim: title ? String(title).trim() : undefined,
                    productId: sku ? String(sku).trim() : undefined,
                    indirimliFiyati: price ? Number(price) : undefined,
                    code: barcode ? String(barcode).trim() : undefined,
                    marka: brand ? String(brand).trim() : undefined,
                    Kategori: category,
                    KategoriHiyerarsi: categoryHierarchy,
                    saticiAdi: product.product.merchantName,
                    saticiId: product.product.merchantId,
                    saticiSehri: product.product.merchantCity,
                    sizes: sizes,
                    color: color,
                    attributes: attributes,
                    açıklama: description ? String(description).trim() : undefined,
                    images: images,
                    vergi: product?.product?.taxVatRate,
                    ortalamaDegerlendirme: product?.product?.reviews?.customerReviewScore,
                    toplamDegerlendirmeSayısı: product?.product?.reviews?.customerReviewCount,
                    bedavaKargo: typeof product.product.shipmentInformation.freeShipping !== 'undefined'
                        ? product.product.shipmentInformation.freeShipping
                            ? 'bedava'
                            : 'bedava değil'
                        : 'belirtilmemiş'
                }
            };

            if (scrapedData.details.isim && scrapedData.details.isim !== 'Belirtilmemiş') {
                results.push(scrapedData);
            } else {
                log.warning(`Eksik veri, Dataset'e eklenmedi: ${request.url}`);
                throw new Error('Eksik veri');
            }
        },
    });

    return { summaryCrawler, listCrawler, detailCrawler };
}

// Rest of your functions remain the same...

export const getDataHB = async (url: string, onProgress?: (progress: string) => void) => {
    results.length = 0;
    urls.length = 0;
    detailLinks.length = 0;
    const response = await fetch(url);
    console.log('Response:', response);
    const { summaryCrawler, listCrawler, detailCrawler } = await initializeCrawlers();

    let pageUrl = '';
    if (url.includes('sayfa=')) {
        pageUrl = url.split('sayfa=')[0] + 'sayfa=';
    } else {
        if (url.includes('?')) {
            pageUrl = url + '&sayfa=';
        } else {
            pageUrl = url + '?sayfa=';
        }
    }

    if (pageUrl === 'none') {
        return results;
    }

    if (typeof onProgress === 'function') {
        onProgress('Ürün Linkleri Toplanıyor...');
    }

    await summaryCrawler.run([url]);

    for (let i = 2; i <= pageCount; i++) {
        urls.push(pageUrl + i);
    }

    await listCrawler.run(urls);
    await detailCrawler.run(detailLinks);

    return results;
}

export const getDataHB2 = async (urls: string[]) => {
    results.length = 0;
    const { detailCrawler } = await initializeCrawlers();
    await detailCrawler.run(urls);
    return results;
}