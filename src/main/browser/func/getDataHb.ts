import { getSettingsJson } from '@/lib'
import { CheerioCrawler, Configuration } from 'crawlee'
import { currentSearchId, isSearchCancelled } from '../../cancelState'
import { TempStorage } from './tempStorage'

const config = Configuration.getGlobalConfig()
config.set('persistStorage', false)

export const getDataHb = async (url: string, options?: any, onProgress?: (progress: any) => void) => {
    const mySearchId = currentSearchId
    const storage = new TempStorage('hepsiburada', 10)
    const detailLinks: string[] = []
    const urls: string[] = []
    let completed = 0
    let listCompleted = 0
    let totalToScrape = 0
    let consecutiveFailures = 0
    const maxFailures = 15
    let listInterrupted = false
    let detailInterrupted = false
    let lastPageScraped = 0

    const settings = await getSettingsJson()
    let productNumber = settings.productNumber
    if (options?.minPage || options?.maxPage) {
        productNumber = Infinity
    }
    const trial = settings.licanceType === 'trial'

    let pageUrl = ''
    if (url.includes('sayfa=')) {
        pageUrl = url.split('sayfa=')[0] + 'sayfa='
    } else {
        pageUrl = url.includes('?') ? url + '&sayfa=' : url + '?sayfa='
    }

    const startPage = options?.minPage ? parseInt(options.minPage) : 1
    const endPage = options?.maxPage ? parseInt(options.maxPage) : (trial ? 1 : Math.ceil(productNumber / 36))
    lastPageScraped = startPage - 1

    if (typeof onProgress === 'function') {
        onProgress({ message: 'Ürün Linkleri Toplanıyor (HB)...' })
    }

    const listCrawler = new CheerioCrawler({
        maxConcurrency: 1,
        maxRequestRetries: 5,
        sameDomainDelaySecs: 3,
        sessionPoolOptions: {
            sessionOptions: {
                maxUsageCount: 5,
            }
        },
        statisticsOptions: {},
        failedRequestHandler({ request, log }) {
            log.error(`List Request failed: ${request.url}`)
            listCompleted++
            consecutiveFailures++
            if (consecutiveFailures >= maxFailures) {
                log.warning(`Üst üste ${maxFailures} liste sayfasından veri alınamadı. İşlem durduruluyor.`)
                listInterrupted = true
                listCrawler.teardown().catch(() => { })
            }
        },
        async requestHandler({ $, log, request }) {
            if (isSearchCancelled || mySearchId !== currentSearchId) {
                listInterrupted = true
                listCrawler.teardown().catch(() => { })
                return
            }

            try {
                log.info(`Scraping List URL: ${request.url}`)
                let items: any[] = []

                $('script[type="application/ld+json"]').each((_, el) => {
                    try {
                        const json = JSON.parse($(el).html() || '{}')
                        if (json.numberOfItems && json.itemListElement) {
                            items = json.itemListElement
                            return false // break
                        }
                        return true
                    } catch (e) {
                        return true
                    }
                })

                if (options?.fastScan) {
                    for (const item of items) {
                        if (storage.count >= productNumber) break
                        const p = item.item || {}
                        const dictionary = {
                            url: p.offers?.url || '',
                            groupId: p.sku || '',
                            details: {
                                isim: p.name || 'Belirtilmemiş',
                                productId: p.sku || 'Belirtilmemiş',
                                marka: p.brand?.name || 'Belirtilmemiş',
                                Kategori: 'Belirtilmemiş',
                                KategoriHiyerarsi: 'Belirtilmemiş',
                                saticiAdi: 'Belirtilmemiş',
                                saticiId: 'Belirtilmemiş',
                                saticiSehri: 'Belirtilmemiş',
                                code: p.sku || 'Belirtilmemiş',
                                indirimliFiyati: p.offers?.price || 'Belirtilmemiş',
                                SatisFiyati: p.offers?.price || 'Belirtilmemiş',
                                OrjinalFiyati: p.offers?.price || 'Belirtilmemiş',
                                KuponluFiyatı: 'Belirtilmemiş',
                                vergi: 'Belirtilmemiş',
                                ortalamaDegerlendirme: 'Belirtilmemiş',
                                toplamDegerlendirmeSayısı: 'Belirtilmemiş',
                                bedavaKargo: 'belirtilmemiş',
                                attributes: {},
                                açıklama: p.description || 'Belirtilmemiş',
                                images: p.image ? [p.image] : [],
                                sizes: [{
                                    itemNumber: p.sku || '',
                                    beden: 'Standart',
                                    barcode: '',
                                    inStock: p.offers?.availability === 'https://schema.org/InStock' ? 'Stokta var' : 'Stokta yok'
                                }]
                            }
                        }
                        storage.push(dictionary)
                    }
                } else {
                    if (items.length > 0) {
                        const links = items.map((item: any) => item.item?.offers?.url).filter((href: string) => href?.startsWith('https://www.hepsiburada.com'))
                        detailLinks.push(...links)
                    } else {
                        const linkElements = $('[class^="productListContent"] li article a[href]').toArray()
                            .map(el => $(el).attr('href'))
                            .filter(href => href && !href.includes('adservice'))
                        const baseUrl = 'https://www.hepsiburada.com'
                        const links = linkElements.map(href => href!.startsWith('http') ? href! : baseUrl + href)
                        detailLinks.push(...links)
                    }
                }
                consecutiveFailures = 0

                // lastPageScraped güncellemesi
                try {
                    const u = new URL(request.url)
                    const sp = u.searchParams.get('sayfa')
                    if (sp) {
                        const pNum = parseInt(sp)
                        if (pNum > lastPageScraped) lastPageScraped = pNum
                    }
                } catch (e) { }

            } catch (err) {
                log.error(`List scraper err: ${err}`)
                consecutiveFailures++
            } finally {
                listCompleted++
                if (consecutiveFailures >= maxFailures) {
                    log.warning(`Üst üste ${maxFailures} liste sayfasından veri alınamadı. İşlem durduruluyor.`)
                    listInterrupted = true
                    listCrawler.teardown().catch(() => { })
                }
                if (options?.fastScan) {
                    const percentVal = urls.length > 0 ? ((listCompleted / urls.length) * 100).toFixed(2) : '0.00'
                    if (listCompleted % 2 === 0 || listCompleted === urls.length) {
                        if (typeof onProgress === 'function') {
                            onProgress({
                                percent: percentVal,
                                total: urls.length * 36, // tahmini
                                success: storage.count,
                                failed: 0
                            })
                        }
                    }
                } else {
                    const percentVal = urls.length > 0 ? ((listCompleted / urls.length) * 100).toFixed(0) : '0'
                    if (listCompleted % 2 === 0 || listCompleted === urls.length) {
                        if (typeof onProgress === 'function') {
                            onProgress({ message: `Ürün Linkleri Toplanıyor (HB)... %${percentVal} - Bulunan Ürün: ${detailLinks.length}` })
                        }
                    }
                }
            }
        }
    })

    // Listeleme sayfalarını kuyruğa ekle
    for (let i = startPage; i <= endPage; i++) {
        urls.push(pageUrl + i)
    }
    await listCrawler.run(urls)

    if (options?.fastScan) {
        if (typeof onProgress === 'function') onProgress({ message: '' })
        return {
            results: storage.finalize(),
            status: listInterrupted ? 'interrupted' : 'completed',
            lastPageScraped: lastPageScraped,
            totalPages: endPage,
            pendingLinks: []
        }
    }

    // listInterrupted ise veya hic urun bulunamadiysa detailCrawler'a gecmeyelim
    if (listInterrupted || detailLinks.length === 0 || options?.onlyLinks) {
        if (typeof onProgress === 'function') onProgress({ message: '' })
        let expectedPages = endPage
        if (productNumber !== Infinity) {
            expectedPages = startPage + Math.ceil(productNumber / 24) - 1
        }
        const computedTotalPages = Math.max(expectedPages, lastPageScraped)

        return {
            results: storage.finalize(),
            status: listInterrupted ? 'interrupted' : 'completed',
            lastPageScraped: lastPageScraped,
            totalPages: computedTotalPages,
            pendingLinks: detailLinks // senaryo 1: iptal olana kadar toplanan linkler kaybolmasın
        }
    }

    // Sadece ürün limitini dolduracak kadar linki çek
    totalToScrape = productNumber === Infinity ? detailLinks.length : Math.min(detailLinks.length, productNumber)
    const linksToScrape = detailLinks.slice(0, totalToScrape)
    const pendingLinksSet = new Set(linksToScrape)

    const detailCrawler = new CheerioCrawler({
        maxConcurrency: 2,
        maxRequestRetries: 5,
        sameDomainDelaySecs: 3,
        sessionPoolOptions: {
            sessionOptions: {
                maxUsageCount: 5,
            }
        },
        statisticsOptions: {},
        failedRequestHandler({ request, log }) {
            log.error(`Detail Request failed: ${request.url}`)
            completed++
            consecutiveFailures++
            if (consecutiveFailures >= maxFailures) {
                log.warning(`Üst üste ${maxFailures} üründen veri alınamadı. İşlem durduruluyor.`)
                detailInterrupted = true
                detailCrawler.teardown().catch(() => { })
            }
            const percentVal = totalToScrape > 0 ? ((completed / totalToScrape) * 100).toFixed(2) : '0.00'
            if (typeof onProgress === 'function') {
                onProgress({
                    percent: percentVal,
                    total: totalToScrape,
                    success: storage.count,
                    failed: completed - storage.count
                })
            }
        },
        async requestHandler({ $, request, log }) {
            if (isSearchCancelled || mySearchId !== currentSearchId) {
                detailInterrupted = true
                detailCrawler.teardown().catch(() => { })
                return
            }
            try {
                log.info(`Scraping detail URL: ${request.url}`)
                const rawJson = $('#reduxStore').html()
                if (!rawJson) {
                    throw new Error('reduxStore script not found')
                }
                const parsed = JSON.parse(rawJson)
                const productState = parsed['product'] || parsed['PDP'] || parsed['productDetail'] || parsed
                let product: any = productState
                if (productState && productState.productState) {
                    product = productState.productState
                }

                const title = product?.product?.name || product?.title || ''
                const barcode = product?.product?.barcode || ''
                const brand = product?.product?.brand || ''
                const categories = product?.product?.categories || []
                const category = categories.length > 0 ? categories[categories.length - 1].categoryName : undefined
                const categoryHierarchy = categories.map((c: any) => c.categoryName).join(' > ') || ''
                const description = $('.productDescriptionContent').html()?.trim() || ''
                const groupId = product?.product?.productId || ''
                const sku = product?.product?.sku || ''
                const price = product?.product?.prices ? Math.min(...product.product.prices.map((p: any) => Number(p.value))) : undefined
                const color = product?.activeVariant?.values?.Renk || ''
                const expGroup = product?.product?.expends?.find((a: any) => a?.groupName === '')

                const attributes = expGroup ? expGroup.properties.reduce((acc: any, p: any) => {
                    acc[p.name] = p.property
                    return acc
                }, {}) : {}

                let images: string[] = []
                if (product?.product.media && Array.isArray(product.product.media)) {
                    images = product.product.media.map((m: any) => m?.url && m?.maxZoomSize ? m.url.replace('{size}', m.maxZoomSize) : null).filter(Boolean)
                }

                let sizes: any[] = []
                if (product?.variants?.Beden) {
                    sizes = product.variants.Beden.properties.map((v: any) => ({
                        beden: v.value,
                        inStock: v.isInStock ? 'Stokta var' : 'Stokta yok',
                        barcode: v.sku
                    }))
                } else if (product?.variants) {
                    sizes = Object.values(product.variants).flatMap((variantGroup: any) =>
                        variantGroup.properties.map((p: any) => ({
                            beden: p.name + ' - ' + p.value,
                            inStock: p.isInStock ? 'Stokta var' : 'Stokta yok',
                            barcode: p.sku
                        }))
                    )
                } else {
                    sizes = [{ beden: 'Standart', inStock: 'Stokta var', barcode: barcode }]
                }

                const scrapedData = {
                    url: request.url,
                    groupId: groupId,
                    details: {
                        isim: title ? String(title).trim() : undefined,
                        productId: sku ? String(sku).trim() : undefined,
                        indirimliFiyati: price ? Number(price) : undefined,
                        OrjinalFiyati: price ? Number(price) : undefined,
                        SatisFiyati: price ? Number(price) : undefined,
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
                            ? (product.product.shipmentInformation.freeShipping ? 'bedava' : 'bedava değil') : 'belirtilmemiş'
                    }
                }

                if (scrapedData.details.isim && scrapedData.details.isim !== 'Belirtilmemiş') {
                    storage.push(scrapedData)
                    consecutiveFailures = 0
                    pendingLinksSet.delete(request.url)
                } else {
                    consecutiveFailures++
                }
            } catch (error) {
                log.error(`Hata oluştu: ${error}`)
                consecutiveFailures++
            } finally {
                completed++
                if (consecutiveFailures >= maxFailures) {
                    log.warning(`Üst üste ${maxFailures} üründen veri alınamadı. İşlem durduruluyor.`)
                    detailInterrupted = true
                    detailCrawler.teardown().catch(() => { })
                }
                const percentVal = totalToScrape > 0 ? ((completed / totalToScrape) * 100).toFixed(2) : '0.00'
                if (typeof onProgress === 'function') {
                    onProgress({
                        percent: percentVal,
                        total: totalToScrape,
                        success: storage.count,
                        failed: completed - storage.count
                    })
                }
            }
        }
    })

    await detailCrawler.run(linksToScrape)

    if (typeof onProgress === 'function') onProgress({ message: '' })

    const finalStatus = (listInterrupted || detailInterrupted) ? 'interrupted' : 'completed'

    let expectedPages = endPage
    if (productNumber !== Infinity) {
        expectedPages = startPage + Math.ceil(productNumber / 24) - 1
    }
    const computedTotalPages = Math.max(expectedPages, lastPageScraped)

    return {
        results: storage.finalize(),
        status: finalStatus,
        lastPageScraped: lastPageScraped,
        totalPages: computedTotalPages,
        pendingLinks: Array.from(pendingLinksSet)
    }
}

export const getDataHB2 = async (urls: string[], onProgress?: (progress: any) => void) => {
    const storage = new TempStorage('hepsiburada2', 10)
    const mySearchId = currentSearchId
    let detailInterrupted = false
    let consecutiveFailures = 0
    const maxFailures = 25
    let completed = 0
    const totalUrls = urls.length
    const pendingLinksSet = new Set(urls)

    const detailCrawler = new CheerioCrawler({
        maxConcurrency: 2,
        maxRequestRetries: 5,
        sameDomainDelaySecs: 3,
        sessionPoolOptions: {
            sessionOptions: {
                maxUsageCount: 5,
            }
        },
        statisticsOptions: {},
        failedRequestHandler({ request, log }) {
            log.error(`Detail Request failed: ${request.url}`)
            completed++
            consecutiveFailures++
            if (consecutiveFailures >= maxFailures) {
                log.warning(`Üst üste ${maxFailures} üründen veri alınamadı. İşlem durduruluyor.`)
                detailInterrupted = true
                detailCrawler.teardown().catch(() => { })
            }
        },
        async requestHandler({ $, request, log }) {
            if (isSearchCancelled || mySearchId !== currentSearchId) {
                detailInterrupted = true
                detailCrawler.teardown().catch(() => { })
                return
            }
            try {
                log.info(`Scraping detail URL: ${request.url}`)
                const rawJson = $('#reduxStore').html()
                if (!rawJson) {
                    throw new Error('reduxStore script not found')
                }
                const parsed = JSON.parse(rawJson)
                const productState = parsed['product'] || parsed['PDP'] || parsed['productDetail'] || parsed
                let product: any = productState
                if (productState && productState.productState) {
                    product = productState.productState
                }

                const title = product?.product?.name || product?.title || ''
                const barcode = product?.product?.barcode || ''
                const brand = product?.product?.brand || ''
                const categories = product?.product?.categories || []
                const category = categories.length > 0 ? categories[categories.length - 1].categoryName : undefined
                const categoryHierarchy = categories.map((c: any) => c.categoryName).join(' > ') || ''
                const description = $('.productDescriptionContent').html()?.trim() || ''
                const groupId = product?.product?.productId || ''
                const sku = product?.product?.sku || ''
                const price = product?.product?.prices ? Math.min(...product.product.prices.map((p: any) => Number(p.value))) : undefined
                const color = product?.activeVariant?.values?.Renk || ''
                const expGroup = product?.product?.expends?.find((a: any) => a?.groupName === '')

                const attributes = expGroup ? expGroup.properties.reduce((acc: any, p: any) => {
                    acc[p.name] = p.property
                    return acc
                }, {}) : {}

                let images: string[] = []
                if (product?.product.media && Array.isArray(product.product.media)) {
                    images = product.product.media.map((m: any) => m?.url && m?.maxZoomSize ? m.url.replace('{size}', m.maxZoomSize) : null).filter(Boolean)
                }

                let sizes: any[] = []
                if (product?.variants?.Beden) {
                    sizes = product.variants.Beden.properties.map((v: any) => ({
                        beden: v.value,
                        inStock: v.isInStock ? 'Stokta var' : 'Stokta yok',
                        barcode: v.sku
                    }))
                } else if (product?.variants) {
                    sizes = Object.values(product.variants).flatMap((variantGroup: any) =>
                        variantGroup.properties.map((p: any) => ({
                            beden: p.name + ' - ' + p.value,
                            inStock: p.isInStock ? 'Stokta var' : 'Stokta yok',
                            barcode: p.sku
                        }))
                    )
                } else {
                    sizes = [{ beden: 'Standart', inStock: 'Stokta var', barcode: barcode }]
                }

                const scrapedData = {
                    url: request.url,
                    groupId: groupId,
                    details: {
                        isim: title ? String(title).trim() : undefined,
                        productId: sku ? String(sku).trim() : undefined,
                        indirimliFiyati: price ? Number(price) : undefined,
                        OrjinalFiyati: price ? Number(price) : undefined,
                        SatisFiyati: price ? Number(price) : undefined,
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
                            ? (product.product.shipmentInformation.freeShipping ? 'bedava' : 'bedava değil') : 'belirtilmemiş'
                    }
                }

                if (scrapedData.details.isim && scrapedData.details.isim !== 'Belirtilmemiş') {
                    storage.push(scrapedData)
                    consecutiveFailures = 0
                    pendingLinksSet.delete(request.url)
                } else {
                    consecutiveFailures++
                }
            } catch (error) {
                log.error(`Hata oluştu: ${error}`)
                consecutiveFailures++
            } finally {
                completed++
                if (typeof onProgress === 'function') {
                    const percentVal = ((completed / totalUrls) * 100).toFixed(2)
                    if (completed % 5 === 0 || completed === totalUrls) {
                        onProgress({
                            percent: percentVal,
                            total: totalUrls,
                            success: storage.count,
                            failed: completed - storage.count
                        })
                    }
                }
                if (consecutiveFailures >= maxFailures) {
                    log.warning(`Üst üste ${maxFailures} üründen veri alınamadı. İşlem durduruluyor.`)
                    detailInterrupted = true
                    detailCrawler.teardown().catch(() => { })
                }
            }
        }
    })

    await detailCrawler.run(urls)
    return {
        results: storage.finalize(),
        status: detailInterrupted ? 'interrupted' : 'completed',
        pendingLinks: Array.from(pendingLinksSet)
    }
}
