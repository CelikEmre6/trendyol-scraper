/* eslint-disable no-unsafe-finally */
import { getSettingsJson } from '@/lib'
import axios from 'axios'
import cheerio from 'cheerio'
/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchScriptContent(url: string) {
  try {
    const { data } = await axios.get(url)
    const $ = cheerio.load(data)
    const scriptContents = $('script')
      .map((_, el) => $(el).html())
      .get()
    const matchingScript = scriptContents.find((content) => content?.includes('inStock'))
    const jsonRegex = /window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*(\{.*?\});/s
    const match = (matchingScript || '').match(jsonRegex)

    if (match) {
      const jsonString = match[1]
      const jsonObject = JSON.parse(jsonString)
      const attributes = jsonObject.product.attributes.reduce((acc, attribute) => {
        const keyName = attribute.key.name
        const valueName = attribute.value.name
        acc[keyName] = valueName
        return acc
      }, {})

      const dictionary: any = {
        url: url,
        groupId: jsonObject.product.productGroupId,
        details: {
          isim: jsonObject.product.name || 'Belirtilmemiş',
          marka: jsonObject.product.brand.name || 'Belirtilmemiş',
          Kategori: jsonObject.product.category.name || 'Belirtilmemiş',
          KategoriHiyerarsi: jsonObject.product.category.hierarchy || 'Belirtilmemiş',
          saticiAdi: jsonObject.product.merchant.name || 'Belirtilmemiş',
          saticiSehri: jsonObject.product.merchant.cityName || 'Belirtilmemiş',
          indirimliFiyati:
            jsonObject.product.variants[0].price.discountedPrice.value || 'Belirtilmemiş',
          SatisFiyati: jsonObject.product.variants[0].price.sellingPrice.value || 'Belirtilmemiş',
          OrjinalFiyati:
            jsonObject.product.variants[0].price.originalPrice.value || 'Belirtilmemiş',
          KuponluFiyatı:
            jsonObject.product.variants[0].price.couponApplicablePrice || 'Belirtilmemiş',
          SepetSayısı: jsonObject.product.socialProof.basketCount || 'Belirtilmemiş',
          GoruntulenmeSayısı: jsonObject.product.socialProof.pageViewCount || 'Belirtilmemiş',
          favoriSayısı: jsonObject.product.socialProof.favoriteCount || 'Belirtilmemiş',
          vergi: jsonObject.product.tax || 'Belirtilmemiş',
          ortalamaDegerlendirme: jsonObject.product.ratingScore.averageRating || 'Belirtilmemiş',
          toplamDegerlendirmeSayısı:
            jsonObject.product.ratingScore.totalRatingCount || 'Belirtilmemiş',
          toplamYorumSayısı: jsonObject.product.ratingScore.totalCommentCount || 'Belirtilmemiş',
          bedavaKargo:
            typeof jsonObject.product.isFreeCargo !== 'undefined'
              ? jsonObject.product.isFreeCargo
                ? 'bedava'
                : 'bedava değil'
              : 'belirtilmemiş',
          attributes,
          açıklama: jsonObject.product.descriptions
            .filter((description) => description.priority === 0) // Filter for priority 0
            .map((description) => description.text)
            .join(' '),
          images: (jsonObject.product.images || []).map(
            (image) => `https://cdn.dsmcdn.com/${image}`
          ),
          sizes: jsonObject.product.allVariants.map((variant) => ({
            itemNumber: variant.itemNumber,
            beden: variant.value,
            barcode: variant.barcode,
            inStock: variant.inStock ? 'Stokta var' : 'Stokta yok'
          }))
        }
      }

      return dictionary
    } else {
      console.log("No 'allVariants' found in the script.")
      return {}
    }
  } catch (error) {
    console.log('Error fetching or parsing data:', error)
  }
}

export const getData = async (url: string, onProgress?: (progress: string) => void) => {
  const allData: any[] = []
  const links: string[] = []
  const productGroups: string[] = []
  let pageUrl = ''
  if (url.includes('pi=')) {
    pageUrl = url.split('pi=')[0] + 'pi='
  } else {
    if (url.includes('?')) {
      pageUrl = url + '&pi='
    } else {
      pageUrl = url + '?pi='
    }
  }

  function getPathAfterTrendyol(url: string): string {
    const baseUrl = 'trendyol.com/'
    const index = url.indexOf(baseUrl)

    if (index !== -1) {
      return url.substring(index + baseUrl.length)
    } else {
      return 'none'
    }
  }
  pageUrl = getPathAfterTrendyol(pageUrl)
  if (pageUrl === 'none') {
    return allData
  }
  if (typeof onProgress === 'function') {
    onProgress('Ürün Linkleri Toplanıyor...')
  }
  const settings = await getSettingsJson()
  const productNumber = settings.productNumber
  const variant = settings.variant
  try {
    for (let page = 1; page <= 250; page++) {
      // const response = await axios.get(
      //   `https://public.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/erkek-kazak-x-g2-c1092?pi=${page}`
      // )
      const response = await axios.get(
        `https://public.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/${pageUrl + page}`
      )
      const data = response.data
      const products = data.result?.products || []

      for (const product of products) {
        const groupId = product.productGroupId
        productGroups.push(groupId)
        if (!links.includes('https://www.trendyol.com' + product.url)) {
          links.push('https://www.trendyol.com' + product.url)
        }
        if (links.length >= productNumber) {
          break
        }
      }

      if (products.length < 24 || links.length >= productNumber) {
        break
      }
    }
  } catch (error) {
    console.error('Data fetch error:', error)
  }

  function chunkArray(arr: string[], size: number): string[][] {
    const chunks: string[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }
  if (variant) {
    const uniqueProductGroups = Array.from(new Set(productGroups))
    const productGroupsChunks = chunkArray(uniqueProductGroups, 24)

    await Promise.all(
      productGroupsChunks.map(async (group) => {
        const queryParams = group.map((id) => `productGroupIds=${id}`).join('&')
        const url = `https://public.trendyol.com/discovery-web-websfxproductgroups-santral/api/v2/product-groups?${queryParams}`

        try {
          const response = await axios.get(url)
          const results = response.data?.result || []

          Object.keys(results).forEach((groupId) => {
            const products = results[groupId] || []

            products.forEach((product: any) => {
              links.push('https://www.trendyol.com' + product.url)
            })
          })
        } catch (error) {
          console.error('Data fetch error:', error)
        }
      })
    )
  }

  const uniqueLinks = Array.from(new Set(links))
  let counter = 1
  const leng = uniqueLinks.length
  // Fetch script content for all products
  for (const link of uniqueLinks) {
    const result = await fetchScriptContent(link)
    if (result.url && result.url.trim()) {
      allData.push(result)
    }
    await new Promise((resolve) => setTimeout(resolve, 100)) // 300 ms bekleme
    const progress = ((counter++ / leng) * 100).toFixed(2)
    if (typeof onProgress === 'function') {
      onProgress(`${progress}%`)
    }
  }
  if (typeof onProgress === 'function') {
    onProgress('')
  }
  return allData
}

export const getData2 = async (urls: string) => {
  const allData: any[] = []
  for (const link of urls.split('\n')) {
    const result = await fetchScriptContent(link)
    if (result.url && result.url.trim()) {
      allData.push(result)
    }
    await new Promise((resolve) => setTimeout(resolve, 100)) // 300 ms bekleme
  }
  return allData
}
