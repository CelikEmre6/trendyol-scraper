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
          className="border-l border-transparent"
        ></Content>
      </RootLayout>
    </>
  )
}

export default App
