import { useRef } from 'react'
import { Content, DraggableTopBar, RootLayout } from './components'
import { UpdateNotification } from './components/UpdateNotification'

function App(): JSX.Element {
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const resetScroll = () => {
    contentContainerRef.current?.scrollTo(0, 0)
  }

    return (
    <>
      <UpdateNotification />
      <DraggableTopBar />
      <RootLayout>
        <Content
          ref={contentContainerRef}
          className="border-l bg-[#2d2d2d] border-l-white/20"
        ></Content>
      </RootLayout>
    </>
  )
}

export default App
