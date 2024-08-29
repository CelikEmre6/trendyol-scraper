import { useRef } from 'react'
import { Content, DraggableTopBar, RootLayout } from './components'

function App(): JSX.Element {
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const resetScroll = () => {
    contentContainerRef.current?.scrollTo(0, 0)
  }

  return (
    <>
      <DraggableTopBar />
      <RootLayout>
        <Content
          ref={contentContainerRef}
          className="border-l bg-zinc-900/50 border-l-white/20"
        ></Content>
      </RootLayout>
    </>
  )
}

export default App
