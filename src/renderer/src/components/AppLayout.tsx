import { useSettings } from '@renderer/hooks/useSettings'
import { appVersion, licance_api_url } from '@shared/constants'
import { ConfigProvider, Input, Tabs, TabsProps, notification } from 'antd'
import { ComponentProps, forwardRef, useEffect, useState } from 'react'
import { Triangle } from 'react-loader-spinner'
import { twMerge } from 'tailwind-merge'
import { validate } from 'uuid'
import { History } from './History'
import { NotePreviewList } from './NotePreviewList'
import { Search } from './Search'
import { Settings } from './Settings'
import { StockLinksComponent } from './StockLinks'
export const RootLayout = ({ children, className, ...props }: ComponentProps<'main'>) => {
  return (
    <main className={twMerge('flex flex-row h-screen', className)} {...props}>
      {children}
    </main>
  )
}

export const Sidebar = ({ className, children, ...props }: ComponentProps<'aside'>) => {
  return (
    <aside
      className={twMerge('w-[250px] h-full overflow-auto bg-[#1E1E1E] shadow-lg', className)}
      {...props}
    >
      {children}
    </aside>
  )
}

const onChange = (key: string) => {
  console.log(key)
}

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

    const checkVersion = async () => {
      await fetch(licance_api_url + '/application/trendyol-scraper', {
        method: 'GET'
      })
        .then((res) => {
          return res.json()
        })
        .then((data) => {
          if (data.version !== appVersion) {
            notification.open({
              message: 'Uygulamanızın Daha Yeni Bir Sürümü Mevcut!',
              description: (
                <div>
                  <p>
                    Yeni sürümü indirmek için lütfen <a href={data.link}>buraya</a> tıklayınız
                  </p>
                </div>
              ),
              duration: 0,
              placement: 'bottomRight'
            })
          }
        })
    }

    const validateLicense = async (key: string) => {
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
        }).then((res) => {
          if (res.status === 200) {
            resolve(true)
            checkVersion().then()
          } else {
            reject(false)
          }
        })
      })
    }

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
          .catch(() => {
            handleUpdateSettings({
              ...settings,
              licanceKey: undefined
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
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
            colorPrimary: '#569CD6', // Windows mavisi
            colorBgBase: '#2e2e2e', // Dark theme taban rengi
            colorTextBase: '#FFFFFF', // Beyaz yazı rengi
            borderRadius: 0, // Hafif köşeli butonlar
            fontFamily: 'Segoe UI, Arial, sans-serif' // Windows fontu
          },
          components: {
            Select: {
              multipleItemBg: '#2e2e2e',
              optionActiveBg: '#3e3e3e',
              optionSelectedBg: '#569CD6'
            },
            Slider: {
              handleColor: '#569CD6',
              handleActiveOutlineColor: '#569CD6'
            }
          }
        }}
      >
        <div ref={ref} className={twMerge('flex-1 h-full overflow-auto', className)} {...props}>
          <Tabs
            onChange={onChange}
            type="card"
            items={items}
            style={{
              width: '100%'
            }}
            tabBarStyle={{
              backgroundColor: '#1e1e1e',
              color: '#FFFFFF',
              borderBottom: '1px solid #333',
              marginBottom: '0px'
            }}
          />
        </div>
      </ConfigProvider>
    )
  }
)

Content.displayName = 'Content'
