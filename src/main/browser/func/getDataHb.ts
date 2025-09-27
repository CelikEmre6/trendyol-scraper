/* eslint-disable prettier/prettier */
/* eslint-disable no-unsafe-finally */
import { Configuration, PlaywrightCrawler } from 'crawlee';
import { firefox } from 'playwright';
/* eslint-disable @typescript-eslint/no-explicit-any */
let camoufox;
let launchOptions;

async function initializeCamoufox() {
    if (!camoufox) {
        camoufox = await import('camoufox-js');
        // For named exports, access them from the module object
        launchOptions = camoufox.launchOptions || camoufox.default?.launchOptions;
    }
    return { camoufox, launchOptions };
}
const config = Configuration.getGlobalConfig();
config.set('persistStorage', false);
let pageCount = 1;
const detailLinks = [] as string[];
const urls = [] as string[];
const results = [] as any[];

// Create async function to initialize crawlers
async function initializeCrawlers() {
    const launchOptions = await initializeCamoufox();
    const launchOpts = launchOptions.launchOptions({
        headless: true,
    });

    const summaryCrawler = new PlaywrightCrawler({
        maxRequestsPerMinute: 15,
        postNavigationHooks: [
            async ({ handleCloudflareChallenge }) => {
                await handleCloudflareChallenge();
            },
        ],
        sameDomainDelaySecs: 3,
        statisticsOptions: {},
        browserPoolOptions: {
            useFingerprints: false,
        },
        launchContext: {
            launcher: firefox,
            launchOptions: launchOpts,
        },
        async requestHandler({ page, request, log }) {
            log.info(`Scraping URL: ${request.url}`);
            const ilanText = await page.$$eval('div', divs => {
                const el = Array.from(divs).find(d => {
                    const text = d.textContent?.trim();
                    return text ? /^\d+\s*ürün$/.test(text) : false;
                });
                return el?.textContent?.trim() || '';
            });
            const ilanCount = parseInt(ilanText.replace(/\D/g, ''), 10);
            pageCount = Math.ceil(ilanCount / 36);
            console.log(`Toplam ilan sayısı: ${ilanCount}, Sayfa: ${pageCount}`);
            const linkElements = await page.$$eval('[class^="productListContent"] li article a[href]', elements =>
                elements
                    .map(el => el.getAttribute('href'))
                    .filter(href => href && !href.includes('adservice'))
            );
            const baseUrl = 'https://www.hepsiburada.com';
            const links = linkElements.map(href => href!.startsWith('http') ? href! : baseUrl + href);

            log.info(`Found links: ${links.length}`);
            detailLinks.push(...links);
        },
    });

    const listCrawler = new PlaywrightCrawler({
        maxRequestsPerMinute: 15,
        postNavigationHooks: [
            async ({ handleCloudflareChallenge }) => {
                await handleCloudflareChallenge();
            },
        ],
        sameDomainDelaySecs: 3,
        statisticsOptions: {},
        browserPoolOptions: {
            useFingerprints: false,
        },
        launchContext: {
            launcher: firefox,
            launchOptions: launchOpts,
        },
        async requestHandler({ page, log }) {
            const linkElements = await page.$$eval('[class^="productListContent"] li article a[href]', elements =>
                elements
                    .map(el => el.getAttribute('href'))
                    .filter(href => href && !href.includes('adservice'))
            );
            const baseUrl = 'https://www.hepsiburada.com';
            const links = linkElements.map(href => href!.startsWith('http') ? href! : baseUrl + href);

            log.info(`Found links: ${links.length}`);
            detailLinks.push(...links);
        },
    });

    const detailCrawler = new PlaywrightCrawler({
        maxRequestsPerMinute: 15,
        postNavigationHooks: [
            async ({ handleCloudflareChallenge }) => {
                await handleCloudflareChallenge();
            },
        ],
        browserPoolOptions: {
            useFingerprints: false,
        },
        launchContext: {
            launcher: firefox,
            launchOptions: launchOpts,
        },
        async requestHandler({ page, request, log }) {
            log.info(`Scraping detail URL: ${request.url}`);
            // Sayfanın tam yüklenmesini bekle
            // try {
            //     await page.waitForSelector('#storefront-app', { timeout: 15000 });
            // } catch (err) {
            //     log.warning(`Sayfa yüklenemedi veya 429 aldık: ${request.url}`);
            //     throw err;
            // }

            await page.waitForTimeout(1500);

            const scrapedData = await page.evaluate(() => {
                const rawJson = document.querySelector('#reduxStore')?.innerHTML;
                if (!rawJson) {
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
                const description = document.querySelector('.productDescriptionContent')?.innerHTML.trim() || '';
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

                return {
                    url: window.location.href,
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
            });

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
async function fetchScriptContent(url: string) {
    // ... existing fetchScriptContent code ...
}

export const getDataHB = async (url: string, onProgress?: (progress: string) => void) => {
    results.length = 0;

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