/* eslint-disable no-unsafe-finally */
import axios from 'axios'
import cheerio from 'cheerio'
/* eslint-disable @typescript-eslint/no-explicit-any */

interface Product {
  productId: number
  url: string
  details: any[]
  productGroupId: number
}

interface GroupedProducts {
  [productGroupId: number]: Product[]
}

async function fetchScriptContent(url: string) {
  try {
    const { data } = await axios.get(url)
    const $ = cheerio.load(data)
    const scriptContents = $('script')
      .map((i, el) => $(el).html())
      .get()
    const matchingScript = scriptContents.find((content) => content?.includes('inStock'))
    const jsonRegex = /window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*(\{.*?\});/s
    const match = matchingScript.match(jsonRegex)

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
        SepetSayısı: jsonObject.product.socialProof.basketCount || 'Belirtilmemiş',
        GoruntulenmeSayısı: jsonObject.product.socialProof.pageViewCount || 'Belirtilmemiş',
        favoriSayısı: jsonObject.product.socialProof.favoriteCount || 'Belirtilmemiş',
        vergi: jsonObject.product.tax || 'Belirtilmemiş',
        ortalamaDegerlendirme: jsonObject.product.ratingScore.averageRating || 'Belirtilmemiş',
        toplamDegerlendirmeSayısı:
          jsonObject.product.ratingScore.totalRatingCount || 'Belirtilmemiş',
        toplamYorumSayısı: jsonObject.product.ratingScore.totalCommentCount || 'Belirtilmemiş',
        marka: jsonObject.product.brand.name || 'Belirtilmemiş',
        bedavaKargo:
          typeof jsonObject.product.isFreeCargo !== 'undefined'
            ? jsonObject.product.isFreeCargo
              ? 'bedava'
              : 'değil'
            : 'belirtilmemiş',
        attributes,
        indirimliFiyati:
          jsonObject.product.variants[0].price.discountedPrice.value || 'Belirtilmemiş',
        SatisFiyati: jsonObject.product.variants[0].price.sellingPrice.value || 'Belirtilmemiş',
        OrjinalFiyati: jsonObject.product.variants[0].price.originalPrice.value || 'Belirtilmemiş',
        KuponluFiyatı:
          jsonObject.product.variants[0].price.couponApplicablePrice || 'Belirtilmemiş',
        Kategori: jsonObject.product.category.name || 'Belirtilmemiş',
        KategoriHiyerarsi: jsonObject.product.category.hierarchy || 'Belirtilmemiş',
        isim: jsonObject.product.name || 'Belirtilmemiş',
        açıklama: jsonObject.product.descriptions
          .sort((a, b) => a.priority - b.priority)
          .map((description) => description.text)
          .join(' '),
        images: (jsonObject.product.images || []).map((image) => `https://cdn.dsmcdn.com/${image}`),
        sizes: jsonObject.product.allVariants.map((variant) => ({
          itemNumber: variant.itemNumber,
          beden: variant.value,
          barcode: variant.barcode,
          inStock: variant.inStock ? 'Stokta var' : 'Stokta yok'
        }))
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

export const getData = async (url: string, onProgress?: (progress: number) => void) => {
  const allData: any[] = []
  const groupedProducts: GroupedProducts = {}
  // let pageUrl = ''
  // if (url.includes('pi=')) {
  //   return allData
  // }
  // if (url.includes('?')) {
  //   pageUrl = url + '&pi='
  // } else {
  //   pageUrl = url + '?pi='
  // }
  try {
    for (let page = 1; page <= 2; page++) {
      const response = await axios.get(
        `https://public.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/erkek-gomlek-x-g2-c75?pi=${page}`
      )
      // const response = await axios.get(pageUrl + page)
      const data = response.data
      const products = data.result?.products || []
      if (products.length == 0 || page == 60) {
        break
      }

      products.forEach((product: any) => {
        const groupId = product.productGroupId
        if (!groupedProducts[groupId]) {
          groupedProducts[groupId] = []
        }
        groupedProducts[groupId].push({
          productId: product.id,
          url: 'https://www.trendyol.com' + product.url,
          details: [],
          productGroupId: groupId
        })
      })
    }
  } catch (error) {
    console.error('Data fetch error:', error)
  }

  const groupedProductIds = Object.keys(groupedProducts)

  function chunkArray(arr: string[], size: number): string[][] {
    const chunks: string[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }

  const productGroupsChunks = chunkArray(groupedProductIds, 24)
  const groupedProducts2: GroupedProducts = {}

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
            if (!groupedProducts2[groupId]) {
              groupedProducts2[groupId] = []
            }
            groupedProducts2[groupId].push({
              productId: product.id,
              url: 'https://www.trendyol.com' + product.url,
              details: [],
              productGroupId: groupId
            })
          })
        })
      } catch (error) {
        console.error('Data fetch error:', error)
      }
    })
  )

  function addMissingGroupsToSecond(
    groupedProducts1: GroupedProducts,
    groupedProducts2: GroupedProducts
  ): GroupedProducts {
    const updatedGroupedProducts2 = { ...groupedProducts2 }

    Object.keys(groupedProducts1).forEach((groupId) => {
      if (!updatedGroupedProducts2[groupId]) {
        updatedGroupedProducts2[groupId] = groupedProducts1[groupId]
      }
    })

    return updatedGroupedProducts2
  }

  const updatedGroupedProducts2 = addMissingGroupsToSecond(groupedProducts, groupedProducts2)
  let counter = 1
  const leng = Object.values(updatedGroupedProducts2).reduce(
    (sum, products) => sum + (products ? products.length : 0),
    0
  )
  // Fetch script content for all products
  for (const groupId of Object.keys(updatedGroupedProducts2)) {
    const products = updatedGroupedProducts2[groupId] || []
    for (const product of products) {
      product.details = await fetchScriptContent(product.url)
      await new Promise((resolve) => setTimeout(resolve, 100)) // 300 ms bekleme
      const progress = ((counter++ / leng) * 100).toFixed(2)
      onProgress(parseFloat(progress))
    }
  }

  const results: any[] = []
  Object.keys(updatedGroupedProducts2).forEach((groupId) => {
    const productsSon = updatedGroupedProducts2[groupId] || []

    productsSon.forEach((product: any) => {
      const id = product.id
      const link = product.url
      const details = product.details
      const gId = product.productGroupId
      results.push({
        id,
        link,
        details,
        gId
      })
    })
  })

  return results
}
