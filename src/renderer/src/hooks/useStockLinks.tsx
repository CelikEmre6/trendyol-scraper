import { stockLinksAtom } from '@/store'
import { useAtom } from 'jotai'

export const useStockLinks = () => {
  const [stockLinks, setStockLinks] = useAtom(stockLinksAtom)

  const handleUpdateStockLinks = async (newStockLinks: string[]) => {
    // Yeni stock linklerini diske kaydet
    await window.context.setStockLinksJson(newStockLinks)
    // Atom state'i güncelle
    setStockLinks(newStockLinks)
  }

  return {
    stockLinks,
    handleUpdateStockLinks
  }
}
