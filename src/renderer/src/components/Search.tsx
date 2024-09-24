/* eslint-disable @typescript-eslint/no-explicit-any */
import { saveSearchResultsAtom } from '@renderer/store'
import { Button } from 'antd'
import { useSetAtom } from 'jotai'
import { useState } from 'react'

export const Search = () => {
  const [url, setUrl] = useState('')

  const [selectedUrl, setSelectedUrl] = useState(null)

  const [searchDescription, setSearchDescription] = useState('')

  const setSearchResults = useSetAtom(saveSearchResultsAtom)

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value)
  }

  const refresh = () => {
    setSearchDescription('')
    setUrl('')
    setSelectedUrl(null)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 relative">
      <input
        type="text"
        placeholder="Trendyol Linki Giriniz"
        value={url}
        onChange={handleUrlChange}
        className="w-96 text-blue-500"
      ></input>
      <Button
        className="w-96"
        onClick={async () => {
          try {
            const data = await window.context.getSearchResults(url!)
            const newSearch = {
              results: data.map((item) => ({
                ...item
              })),
              date: new Date().getTime(),
              description: url.slice(url.indexOf('trendyol.com/') + 13)
            }
            await setSearchResults(newSearch)
            refresh()
          } catch (error) {
            console.error(error)
          }
        }}
        type="primary"
      >
        Veriler Al
      </Button>
      <div className="width: 100%; background-color: #ddd;">
        <div id="progressBar" className="width: 0%; height: 30px; background-color: #4CAF50;"></div>
      </div>
    </div>
  )
}
