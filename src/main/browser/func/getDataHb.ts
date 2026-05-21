/* eslint-disable prettier/prettier */
/* eslint-disable no-unsafe-finally */
import { getSettingsJson } from '@/lib';
import { CheerioCrawler, Configuration } from 'crawlee';
import { isSearchCancelled } from '../../cancelState';
import { TempStorage } from './tempStorage';
/* eslint-disable @typescript-eslint/no-explicit-any */

const config = Configuration.getGlobalConfig();
config.set('persistStorage', false);
const detailLinks = [] as string[];
const urls = [] as string[];
let completed = 0;

// Create async function to initialize crawlers
async function initializeCrawlers(storage: TempStorage, onProgress?: (progress: any) => void) {

    const summaryCrawler = new CheerioCrawler({
        statisticsOptions: {},
        async requestHandler({ $, request, log }) {
            if (isSearchCancelled) return;
            log.info(`Scraping URL: ${request.url}`);
            let ilanCount = 0;
            let items = [];
            // 1️⃣ Try to get from ld+json
            $('script[type="application/ld+json"]').each((_, el) => {
                try {
                    const json = JSON.parse($(el).html() || '{}');
                    if (json.numberOfItems) {
                        ilanCount = json.numberOfItems;
                        items = json.itemListElement;
                        return false; // break
                    }
                    return true;
                } catch (e) {
                    return true
                }
            });

            // 2️⃣ Fallback: look for "(xx ürün)" or "xx ürün" text in any element (more flexible)
            if (!ilanCount) {
                const allTexts = $('*').toArray()
                    .map(el => $(el).text().trim())
                    .filter(t => t && t.length < 100); // ignore long blocks like descriptions
                const matchText = allTexts.find(t => /\(?\d+\)?\s*ürün/i.test(t));
                if (matchText) {
                    ilanCount = parseInt(matchText.replace(/\D/g, ''), 10);
                }
            }
            let links = [] as string[]
            console.log(`Toplam ilan sayısı: ${ilanCount}`);
            if (items.length > 0) {
                const links2 = items.map((item: any) => item.item.offers.url);
                links = links2.filter((href: string) => href && href!.startsWith('https://www.hepsiburada.com'));
            } else {
                const linkElements = $('[class^="productListContent"] li article a[href]').toArray()
                    .map(el => $(el).attr('href'))
                    .filter(href => href && !href.includes('adservice'));
                const baseUrl = 'https://www.hepsiburada.com';
                links = linkElements.map(href => href!.startsWith('http') ? href! : baseUrl + href);
            }
            log.info(`Found links: ${links.length}`);
            detailLinks.push(...links);
        },
    });

    const listCrawler = new CheerioCrawler({
        sameDomainDelaySecs: 2,
        statisticsOptions: {},
        async requestHandler({ $, log, request }) {
            if (isSearchCancelled) return;
            log.info(`Scraping URL: ${request.url}`);
            const linkElements = $('[class^="productListContent"] li article a[href]').toArray()
                .map(el => $(el).attr('href'))
                .filter(href => href && !href.includes('adservice'));
            const baseUrl = 'https://www.hepsiburada.com';
            const links = linkElements.map(href => href!.startsWith('http') ? href! : baseUrl + href);

            detailLinks.push(...links);
            log.info(`Found links: ${links.length}`);
        },
    });

    const detailCrawler = new CheerioCrawler({
        sameDomainDelaySecs: 2,
        statisticsOptions: {},
        async requestHandler({ $, request, log }) {
            if (isSearchCancelled) return;
            try {
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
                const barcode = product?.product?.barcode || '';
                const brand = product?.product?.brand || '';
                const categories = product?.product?.categories || [];
                const category = categories.length > 0 ? categories[categories.length - 1].categoryName : undefined;
                const categoryHierarchy = categories.map((c: any) => c.categoryName).join(' > ') || '';
                const description = $('.productDescriptionContent').html()?.trim() || '';
                const groupId = product?.product?.productId || '';
                const sku = product?.product?.sku || '';
                const price = product?.product?.prices
                    ? Math.min(...product.product.prices.map((p: any) => Number(p.value)))
                    : undefined;
                const color = product?.activeVariant?.values?.Renk || '';
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
                        saticiAdi: product?.product?.merchantName,
                        saticiId: product?.product?.merchantId,
                        saticiSehri: product?.product?.merchantCity,
                        sizes: sizes,
                        color: color,
                        attributes: attributes,
                        açıklama: description ? String(description).trim() : undefined,
                        images: images,
                        vergi: product?.product?.taxVatRate,
                        ortalamaDegerlendirme: product?.product?.reviews?.customerReviewScore,
                        toplamDegerlendirmeSayısı: product?.product?.reviews?.customerReviewCount,
                        bedavaKargo: typeof product?.product?.shipmentInformation?.freeShipping !== 'undefined'
                            ? product?.product?.shipmentInformation?.freeShipping
                                ? 'bedava'
                                : 'bedava değil'
                            : 'belirtilmemiş'
                    }
                };

                if (scrapedData.details.isim && scrapedData.details.isim !== 'Belirtilmemiş') {
                    storage.push(scrapedData);
                } else {
                    log.warning(`Eksik veri, Dataset'e eklenmedi: ${request.url}`);
                    throw new Error('Eksik veri');
                }
            } catch (error) {
                log.error(`Hata oluştu: ${error}`);
                throw error;
            } finally {
                completed++;
                const percentVal = detailLinks.length > 0 ? ((completed / detailLinks.length) * 100).toFixed(2) : '0.00';

                // Sadece her 10 üründe bir veya en sonda arayüze mesaj göndererek IPC darboğazını (Crash) önle
                if (completed % 10 === 0 || completed === detailLinks.length) {
                    if (typeof onProgress === 'function') {
                        onProgress({
                            percent: percentVal,
                            total: detailLinks.length,
                            success: storage.count,
                            failed: completed - storage.count
                        });
                    }
                }
            }
        }
    });

    return { summaryCrawler, listCrawler, detailCrawler };
}

// Rest of your functions remain the same...

export const getDataHB = async (url: string, onProgress?: (progress: any) => void) => {
    const storage = new TempStorage('hepsiburada', 10);
    urls.length = 0;
    detailLinks.length = 0;
    completed = 0;
    const settings = await getSettingsJson();
    const productNumber = settings?.productNumber || 100;
    const trial = settings?.licanceType === 'trial'
    const pageCount = trial ? 1 : Math.ceil(productNumber / 36); // Hepsiburada'da sayfa başına 36 ürün var
    const { summaryCrawler, listCrawler, detailCrawler } = await initializeCrawlers(storage, onProgress);

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
        return storage.finalize();
    }

    if (typeof onProgress === 'function') {
        onProgress({ message: 'Ürün Linkleri Toplanıyor...' });
    }

    await summaryCrawler.run([url]);

    for (let i = 2; i <= pageCount; i++) {
        urls.push(pageUrl + i);
    }

    await listCrawler.run(urls);

    console.log('detailLinks:', detailLinks.length);
    await detailCrawler.run(detailLinks);

    return storage.finalize(); // Diskten oku, geçici dosyayı sil, sonuçları dön
}

export const getDataHB2 = async (urls: string[]) => {
    const storage = new TempStorage('hepsiburada', 10);
    const { detailCrawler } = await initializeCrawlers(storage);
    await detailCrawler.run(urls);
    return storage.finalize();
}