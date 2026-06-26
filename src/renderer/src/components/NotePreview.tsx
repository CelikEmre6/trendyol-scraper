import { CalendarOutlined, ShoppingOutlined, ThunderboltFilled } from '@ant-design/icons'
import { cn, formatDateFromMs } from '@renderer/utils'
import { Search, SearchResult } from '@shared/models'
import { ComponentProps } from 'react'

export type NotePreviewProps = Search & {
  isActive?: boolean
  results: SearchResult[]
  onResume?: () => void
  isResuming?: boolean
  fastScan?: boolean
} & Omit<ComponentProps<'div'>, 'results'>

const MarketplaceLogo = ({ url }: { url?: string }) => {
  if (!url) return null
  if (url.includes('trendyol.com')) {
    return (
      <div className="flex items-center justify-center bg-[#F27A1A] rounded px-1.5 py-0.5" title="Trendyol">
        <span className="text-white text-[9px] font-extrabold tracking-tight">trendyol</span>
      </div>
    )
  }
  if (url.includes('hepsiburada.com')) {
    return (
      <div className="flex items-center justify-center bg-[#FF6000] rounded px-1.5 py-0.5" title="Hepsiburada">
        <span className="text-white text-[9px] font-extrabold tracking-tight">hepsiburada</span>
      </div>
    )
  }
  return null
}


export const NotePreview = ({
  description,
  content,
  date,
  fastScan,
  isActive = false,
  className,
  results,
  status,
  pendingLinks,
  lastPageScraped,
  totalPages,
  onResume,
  isResuming,
  ...props
}: NotePreviewProps) => {
  const dateTime = formatDateFromMs(date)
  const firstUrl = results?.[0]?.url
    
return (
    <div
      className={cn(
        'cursor-pointer p-3 rounded-xl transition-all duration-300 relative group overflow-hidden flex flex-col',
        {
          'bg-blue-500/15 border border-blue-500/40 shadow-[0_0_20px_rgba(79,172,254,0.2)]': isActive,
          'bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]': !isActive
        },
        className
      )}
      {...props}
    >
      {/* Ince Sol Cizgi Vurgusu */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300",
          {
            "bg-[#4facfe] shadow-[0_0_10px_#4facfe]": isActive,
            "bg-transparent group-hover:bg-white/20": !isActive
          }
        )} 
      />
      
      <div className="pl-2 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 
            className={cn(
              "font-semibold text-sm line-clamp-2 leading-snug flex-1",
              {
                "text-[#4facfe]": isActive,
                "text-white/70 group-hover:text-white/90": !isActive
              }
            )}
            title={description}
          >
            {description}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {fastScan && (
              <div 
                className="flex items-center justify-center bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 w-5 h-5 rounded-md text-[10px]"
                title="Hızlı Tarama (Fast Scan)"
              >
                <ThunderboltFilled />
              </div>
            )}
            <MarketplaceLogo url={firstUrl} />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className={cn("flex items-center gap-1.5 text-[11px]", isActive ? "text-blue-200/70" : "text-white/40")}>
            <CalendarOutlined />
            <span>{dateTime}</span>
          </div>
          
          <div 
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-300",
              {
                "bg-blue-500/20 border-blue-500/40 text-blue-300": isActive,
                "bg-white/5 border-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white/70": !isActive
              }
            )}
          >
            <ShoppingOutlined />
            <span>{results?.length || 0}</span>
          </div>
        </div>

        {status === 'interrupted' && (
          <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Yarım Kaldı
              </span>
              <div className="text-[10px] text-white/50 flex flex-col items-end">
                {pendingLinks && pendingLinks.length > 0 && <span>{pendingLinks.length} link kaldı</span>}
                {lastPageScraped !== undefined && totalPages !== undefined && lastPageScraped < totalPages && (
                  <span>{totalPages - lastPageScraped} sayfa kaldı</span>
                )}
              </div>
            </div>
            {onResume && (
              <button
                disabled={isResuming}
                onClick={(e) => {
                  e.stopPropagation()
                  onResume()
                }}
                className="w-full text-center py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isResuming ? 'Devam Ediliyor...' : 'Devam Et'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
