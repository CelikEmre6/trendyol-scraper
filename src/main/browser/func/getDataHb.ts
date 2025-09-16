/* eslint-disable prettier/prettier */

import * as cheerio from 'cheerio';
import { CheerioCrawler } from 'crawlee';

interface ProductListing {
    productUrls: string[]
    nextPageUrl?: string
}

class ProductScraper {
    private listingCrawler: CheerioCrawler
    private productCrawler: CheerioCrawler
    private productUrls: Set<string> = new Set()
    private processedCount: number = 0
    private onprogress: any
    private results: any[] = []

    constructor(onprogressF: any) {
        this.listingCrawler = new CheerioCrawler({
            maxRequestsPerMinute: 100,
            requestHandler: this.handleListingPage.bind(this),

        })

        this.productCrawler = new CheerioCrawler({
            maxRequestsPerMinute: 50,
            requestHandler: this.handleProductPage.bind(this),
        })
        this.onprogress = onprogressF
    }

    // Listing sayfasını işleme
    private async handleListingPage({ request, $ }: any): Promise<void> {
        console.log(`Scraping listing page: ${request.url}`)

        try {
            // Bu kısmı sitenizin yapısına göre özelleştirin
            const listingData = this.extractProductUrls($)

            // Ürün URL'lerini kaydet
            listingData.productUrls.forEach((url) => {
                let absoluteUrl = this.makeAbsoluteUrl(url, request.url)
                if (absoluteUrl) {
                    try {
                        const u = new URL(absoluteUrl)
                        u.search = '' // remove query params
                        absoluteUrl = u.href
                        // eslint-disable-next-line no-empty
                    } catch { }
                    if (
                        !this.productUrls.has(absoluteUrl) &&
                        absoluteUrl !== 'https://www.hepsiburada.com/null'
                    ) {
                        this.productUrls.add(absoluteUrl)
                    }
                }
            })

            if (listingData.productUrls.length === 36) {
                const currentUrl = new URL(request.url)
                const currentPage = Number(currentUrl.searchParams.get('sayfa') || '1')
                currentUrl.searchParams.set('sayfa', String(currentPage + 1))
                const nextPageUrl = currentUrl.href
                await this.listingCrawler.addRequests([{ url: nextPageUrl, label: 'LISTING' }])
            }
        } catch (error) {
            console.error(`Error processing listing page ${request.url}:`, error)
        }
    }

    // Ürün sayfasını işleme
    private async handleProductPage({ request, $ }: any): Promise<any> {
        console.log(`Scraping product page: ${request.url}`)

        try {
            // Bu kısmı sitenizin yapısına göre özelleştirin
            const productData = this.extractProductData($, request.url)

            // Veriyi kaydet
            this.results.push(productData)

            this.processedCount++
            const progress = (this.processedCount / (this.productUrls.size) * 100).toFixed(2)
            if (typeof this.onprogress === 'function') {
                this.onprogress(`${progress}%`)
            }
            console.log(`Progress: ${this.processedCount}/${this.productUrls.size} products processed`)
            return productData
        } catch (error) {
            console.error(`Error processing product page ${request.url}:`, error)
        }
    }

    // Ürün URL'lerini çıkarma (ÖZELLEŞTİRİLECEK)
    private extractProductUrls($: cheerio.CheerioAPI): ProductListing {
        // ÖRNEK: CSS selektörlerini sitenize göre değiştirin
        const productUrls: string[] = []

        // Ürün linklerini bul
        $('[class^="productListContent"] li article a[href]').each((_, element) => {
            const href = $(element).attr('href')
            if (href && !productUrls.includes(href) && !href.includes('adservice')) {
                productUrls.push(href)
            }
        })
        console.log(productUrls)

        // Sonraki sayfa linkini bul
        const nextPageUrl: string | undefined = undefined

        return {
            productUrls,
            nextPageUrl
        }
    }

    // Ürün verilerini çıkarma (ÖZELLEŞTİRİLECEK)
    private extractProductData($: cheerio.CheerioAPI, url: string): any {
        // ÖRNEK: CSS selektörlerini sitenize göre değiştirin
        // Ürün verilerini reduxStore scriptinden çıkart
        try {
            const rawJson = $('#reduxStore').html()
            if (!rawJson) {
                throw new Error('reduxStore script not found')
            }
            const parsed = JSON.parse(rawJson)
            // Hepsiburada reduxStore yapısına göre ana state anahtarını bul
            // Genellikle ürün bilgileri "product" veya benzeri bir anahtarda olabilir
            // Aşağıdaki örnek anahtarlar, gerçek yapıya göre özelleştirilmeli
            const productState = parsed['product'] || parsed['PDP'] || parsed['productDetail'] || parsed
            let product: any = productState
            // Eğer bir alt anahtar varsa buradan alın (ör: productState.product)
            if (productState && productState.productState) {
                product = productState.productState
            }
            // Fallback: product anahtarları belirle
            const title = product?.product?.name || product?.title || ''
            const barcode = product.product.barcode || ''
            const brand = product.product.brand || ''
            const categories = product.product.categories || []
            const category =
                categories.length > 0 ? categories[categories.length - 1].categoryName : undefined
            const categoryHierarchy = categories.map((c: any) => c.categoryName).join(' > ') || ''
            const description = $('.productDescriptionContent').text() || ''
            const groupId = product?.product?.productId || ''
            const sku = product.product.sku || ''
            const price = product?.product?.prices
                ? Math.min(...product.product.prices.map((p: any) => Number(p.value)))
                : undefined
            const color = product.activeVariant.values.Renk || ''
            const expGroup = product?.product?.expends?.find((a: any) => a?.groupName === '')
            const attributes = expGroup
                ? expGroup.properties.reduce((acc: any, p: any) => {
                    const keyName = p.name
                    const valueName = p.property
                    acc[keyName] = valueName
                    return acc
                }, {})
                : {}
            let images: string[] = []
            if (product?.product.media && Array.isArray(product.product.media)) {
                images = product.product.media
                    .map((m: any) => {
                        if (m?.url && m?.maxZoomSize) {
                            return m.url.replace('{size}', m.maxZoomSize)
                        }
                        return null
                    })
                    .filter(Boolean)
            }
            let sizes: any[] = []

            if (product?.variants.Beden) {
                // Kıyafetler için sadece Beden
                sizes = product.variants.Beden.properties.map((v: any) => ({
                    beden: v.value,
                    inStock: v.isInStock ? 'Stokta Var' : 'Stokta Yok',
                    barcode: v.sku
                }))
            } else if (product?.variants) {
                // Diğer ürünler için tüm varyantları düz liste olarak al
                sizes = Object.values(product.variants)
                    .flatMap((variantGroup: any) =>
                        variantGroup.properties.map((p: any) => ({
                            beden: p.name + ' - ' + p.value,
                            inStock: p.isInStock ? 'Stokta Var' : 'Stokta Yok',
                            barcode: p.sku
                        }))
                    )
            }
            const normalizeUrl = (url: string) => {
                try {
                    const u = new URL(url)
                    u.search = '' // remove query params
                    return u.href
                } catch {
                    return url
                }
            }

            let colorVariantsLinks: string[] = []

            if (product?.variants?.Renk?.properties?.length) {
                colorVariantsLinks = Array.from(
                    new Set(
                        product.variants.Renk.properties
                            .filter((v: any) => v?.value && v.value !== color && v.urlName && v.sku)
                            .map((v: any) => {
                                try {
                                    let baseUrl = `https://www.hepsiburada.com/${v.urlName}`
                                    if (!baseUrl.includes(`-p-${v.sku}`)) {
                                        baseUrl = `${baseUrl}-p-${v.sku}`
                                    }
                                    return normalizeUrl(baseUrl)
                                } catch {
                                    return null
                                }
                            })
                            .filter((u: any) => typeof u === 'string' && u && !u.endsWith('/null'))
                    )
                )
            }
            if (colorVariantsLinks && Array.isArray(colorVariantsLinks)) {
                for (const variantUrl of colorVariantsLinks) {
                    if (variantUrl && typeof variantUrl === 'string' && !this.productUrls.has(variantUrl)) {
                        this.productUrls.add(variantUrl)
                        this.productCrawler.addRequests([{ url: variantUrl, label: 'PRODUCT' }])
                    }
                }
            }
            const productData = {
                url: url,
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
                    bedavaKargo:
                        typeof product.product.shipmentInformation.freeShipping !== 'undefined'
                            ? product.product.shipmentInformation.freeShipping
                                ? 'bedava'
                                : 'bedava değil'
                            : 'belirtilmemiş'
                }
            }

            return productData
        } catch (err) {
            // Fallback: en azından url ver
            return { url }
        }
    }

    // Göreli URL'yi mutlak URL'ye çevirme
    private makeAbsoluteUrl(url: string, baseUrl: string): string | null {
        try {
            return new URL(url, baseUrl).href
        } catch (error) {
            console.error(`Error creating absolute URL from ${url} and base ${baseUrl}:`, error)
            return null
        }
    }

    // Scraping işlemini başlat
    public async startScraping(startUrls: string[]): Promise<any> {
        console.log('Starting scraping process...')

        // Listing sayfalarını işle
        await this.listingCrawler.run(
            startUrls.map((url) => ({
                url,
                label: 'LISTING'
            }))
        )

        console.log(`Found ${this.productUrls.size} product URLs`)

        // Ürün sayfalarını işle
        const productUrlsArray = Array.from(this.productUrls)
        await this.productCrawler.run(
            productUrlsArray.map((url) => ({
                url,
                label: 'PRODUCT'
            }))
        )

        console.log('Scraping completed!')
        return this.results
    }

    // Scraping doğrudan ürün sayfalarından başlat (product page'ler)
    public async startScrapingFromProductPages(productPageUrls: string[]): Promise<any> {
        console.log('Starting scraping from product pages...')
        // Normalize and add to set
        for (const rawUrl of productPageUrls) {
            if (!rawUrl || typeof rawUrl !== 'string') continue
            let absoluteUrl = rawUrl.trim()
            try {
                const u = new URL(absoluteUrl)
                u.search = '' // remove query params
                absoluteUrl = u.href
            } catch { /* empty */ }
            if (
                !this.productUrls.has(absoluteUrl) &&
                absoluteUrl !== 'https://www.hepsiburada.com/null'
            ) {
                this.productUrls.add(absoluteUrl)
            }
        }

        const productUrlsArray = Array.from(this.productUrls)
        if (productUrlsArray.length === 0) {
            console.log('No product urls to process.')
            return this.results
        }
        await this.productCrawler.run(
            productUrlsArray.map((url) => ({
                url,
                label: 'PRODUCT'
            }))
        )

        console.log('Product pages scraping completed!')
        return this.results
    }
}

export const getDataHB = async (url: string, onProgress?: (progress: string) => void) => {
    const productScraper = new ProductScraper(onProgress)
    const data = await productScraper.startScraping([url])
    return data
}

export const getDataHB2 = async (urls: string | string[]) => {
    const productScraper = new ProductScraper(undefined)
    let urlArray: string[] = []

    if (typeof urls === 'string') {
        urlArray = urls.split('\n').map(s => s.trim()).filter(Boolean)
    } else {
        urlArray = urls
    }

    if (urlArray.length === 0) return []

    const data = await productScraper.startScrapingFromProductPages(urlArray)
    return data
}
