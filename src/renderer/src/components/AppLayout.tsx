import { useSettings } from '@renderer/hooks/useSettings'
import { licance_api_url } from '@shared/constants'
import { ConfigProvider, Input, Tabs, TabsProps } from 'antd'
import { ComponentProps, forwardRef, useCallback, useEffect, useState } from 'react'
import { Triangle } from 'react-loader-spinner'
import { twMerge } from 'tailwind-merge'
import { validate } from 'uuid'
import { History } from './History'
import { NotePreviewList } from './NotePreviewList'
import { Search } from './Search'
import { Settings } from './Settings'
import { StockLinksComponent } from './StockLinks'
import { useAtom } from 'jotai'
import { activeTabAtom } from '@renderer/store'
export const RootLayout = ({ children, className, ...props }: ComponentProps<'main'>) => {
  return (
    <main className={twMerge('flex flex-row h-screen relative overflow-hidden bg-[#09090b]', className)} {...props}>
      {/* Animated Background Blobs - Görünürlük artırıldı */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#4facfe] rounded-full blur-3xl opacity-50 animate-blob pointer-events-none"></div>
      <div className="absolute top-20 right-20 w-96 h-96 bg-[#8b5cf6] rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-[#00f2fe] rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000 pointer-events-none"></div>
      
      {/* Content wrapper with z-index to stay above blobs */}
      <div className="z-10 flex flex-row w-full h-full">
        {children}
      </div>
    </main>
  )
}

export const Sidebar = ({ className, children, ...props }: ComponentProps<'aside'>) => {
  return (
    <aside
      className={twMerge('w-[250px] h-full overflow-auto bg-[#1E1E1E]/80 backdrop-blur-md shadow-lg', className)}
      {...props}
    >
      {children}
    </aside>
  )
}

// Tab onChange is now handled inside Content

const items: TabsProps['items'] = [
  {
    key: '1',
    label: 'Arama Yap',
    children: (
      <div className="w-full flex justify-center items-center h-[calc(100vh-42px)]">
        <Search />
      </div>
    )
  },
  {
    key: '2',
    label: 'Geçmiş Aramalar',
    children: (
      <div className="w-full flex justify-start items-start h-[calc(100vh-42px)]">
        <Sidebar>
          <NotePreviewList />
        </Sidebar>
        <History />
      </div>
    )
  },
  {
    key: '4',
    label: 'Ürün Linkleri',
    children: (
      <div className="w-full flex justify-start items-start h-[calc(100vh-42px)] px-8 pt-8">
        <StockLinksComponent />
      </div>
    )
  },
  {
    key: '3',
    label: 'Ayarlar',
    children: (
      <div className="w-full flex justify-start items-start h-[calc(100vh-42px)] px-8 pt-8">
        <Settings />
      </div>
    )
  }
]

export const Content = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, children, ...props }, ref) => {
    const [loading, setLoading] = useState(true)
    const { settings, handleUpdateSettings } = useSettings()
    const [activeTab, setActiveTab] = useAtom(activeTabAtom)

    // const checkVersion = async () => {
    //   await fetch(licance_api_url + '/application/trendyol-scraper', {
    //     method: 'GET'
    //   })
    //     .then((res) => {
    //       return res.json()
    //     })
    //     .then((data) => {
    //       if (data.version !== appVersion) {
    //         notification.open({
    //           message: 'Uygulamanızın Daha Yeni Bir Sürümü Mevcut!',
    //           description: (
    //             <div>
    //               <p>
    //                 Yeni sürümü indirmek için lütfen <a href={data.link}>buraya</a> tıklayınız
    //               </p>
    //             </div>
    //           ),
    //           duration: 0,
    //           placement: 'bottomRight'
    //         })
    //       }
    //     })
    // }

    const validateLicense = useCallback(async (key: string) => {
      return new Promise<boolean>((resolve, reject) => {
        fetch(licance_api_url + '/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            macAddress: settings?.macAddress,
            key: key
          })
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error('SERVER_ERROR')
            }
            return res.json()
          })
          .then((data) => {
            console.log(data)
            if (data?.status === 'ok') {
              if (
                data.type &&
                (settings?.licanceType !== data.type || settings?.licancePlan !== data.plan)
              ) {
                handleUpdateSettings({
                  ...settings,
                  licanceType: data.type,
                  licancePlan: data.plan
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any)
              }
              resolve(true)
            } else {
              reject()
            }
          })
          .catch(reject)
      })
    }, [settings?.macAddress, settings?.licanceType, settings?.licancePlan])

    const activateLicense = async (key: string) => {
      const data = fetch(licance_api_url + '/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          macAddress: settings?.macAddress,
          key: key
        })
      })
        .then((res) => {
          return res.json()
        })
        .then((data) => {
          console.log(data)
          if (data?.status === 'ok') {
            handleUpdateSettings({
              ...settings,
              licanceKey: key
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
            console.log("Lisans Anahtarı Doğrulandı")
            //a58d11d4-d309-45e9-85dd-75ffb9bd5ad2
            setLoading(false)
          }
        })
    }

    useEffect(() => {
      if (settings?.licanceKey) {
        validateLicense(settings.licanceKey)
          .then(() => {
            console.log('Lisans anahtarı geçerli')
            setLoading(false)
          })
          .catch((err) => {
            if (err?.message === 'INVALID_KEY') {
              handleUpdateSettings({
                ...settings,
                licanceKey: undefined
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any)
            } else {
              console.log('Lisans doğrulama ağ/sunucu hatası nedeniyle atlandı')
              setLoading(false)
            }
          })
      }
    }, [validateLicense, settings?.licanceKey])

    if (!settings?.licanceKey) {
      return (
        <div className="w-full flex justify-center items-center h-[calc(100vh)] flex-col bg-[#2d2d2d]">
          <p>
            <strong>Lütfen Lisans Anahtarını Giriniz!</strong>
          </p>
          <Input
            placeholder="Lisans Anahtarı"
            style={{
              width: '300px',
              marginTop: '10px'
            }}
            onChange={async (e) => {
              const isValid = validate(e.target.value)
              if (isValid) {
                await activateLicense(e.target.value)
              }
            }}
          />
        </div>
      )
    }

    if (loading) {
      return (
        <div className="w-full flex justify-center items-center h-[calc(100vh)] bg-[#2d2d2d]">
          <Triangle
            visible={true}
            height="80"
            width="80"
            color="#4fa94d"
            ariaLabel="triangle-loading"
            wrapperStyle={{}}
            wrapperClass=""
          />
          <p>
            <strong>Bilgileriniz Doğrulanıyor...</strong>
          </p>
        </div>
      )
    }

    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#4facfe', // Neon mavi
            colorBgBase: '#141414', // Şeffaf yerine koyu gri, böylece popuplar okunabilir olur
            colorBgContainer: 'rgba(20, 20, 20, 0.4)', // Form elemanları şeffaf cam gibi
            colorBgElevated: '#1f1f1f', // Tooltip, Message ve Modal arka planları kesinlikle koyu
            colorTextBase: '#FFFFFF',
            colorTextLightSolid: '#FFFFFF', // Tooltip yazıları her zaman beyaz
            borderRadius: 12,
            fontFamily: 'Inter, sans-serif',
            colorBorder: 'rgba(255,255,255,0.1)',
            colorBgSpotlight: '#000000', // Tooltip siyah fon
          },
          components: {
            Select: {
              multipleItemBg: 'rgba(255,255,255,0.1)',
              optionActiveBg: 'rgba(255,255,255,0.05)',
              optionSelectedBg: 'rgba(79, 172, 254, 0.3)'
            },
            Slider: {
              handleColor: '#4facfe',
              handleActiveOutlineColor: '#4facfe'
            },
            Tabs: {
              itemColor: 'rgba(255,255,255,0.6)',
              itemSelectedColor: '#4facfe',
              itemHoverColor: '#00f2fe'
            },
            Table: {
              colorBgContainer: 'transparent',
              headerBg: 'rgba(255,255,255,0.05)',
              rowHoverBg: 'rgba(79, 172, 254, 0.1)',
              borderColor: 'rgba(255,255,255,0.05)'
            }
          }
        }}
      >
        <div ref={ref} className={twMerge('flex-1 h-full overflow-auto z-10', className)} {...props}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            type="line"
            items={items}
            style={{ width: '100%' }}
            tabBarStyle={{
              padding: '0 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '0px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(0,0,0,0.2)'
            }}
          />
        </div>
      </ConfigProvider>
    )
  }
)

Content.displayName = 'Content'
