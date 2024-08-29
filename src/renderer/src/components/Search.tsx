/* eslint-disable @typescript-eslint/no-explicit-any */
import { saveSearchResultsAtom } from '@renderer/store'
import { Button, Select, TreeSelect } from 'antd'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { LuRefreshCw } from 'react-icons/lu'

function getUniqueSecondParts(arr): string[] {
  const secondParts = arr.map((item) => item.split('-')[1]) // İkinci kısmı al
  const uniqueSecondParts = [...new Set(secondParts)] // Benzersiz değerleri filtrele
  return uniqueSecondParts as string[]
}

export const Search = () => {
  const [captchaSolved, setCaptchaSolved] = useState(false)

  const [cities, setCities] = useState([])
  const [towns, setTowns] = useState([])
  const [districts, setDistricts] = useState([])

  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedTown, setSelectedTown] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState([])

  const [searchDescription, setSearchDescription] = useState('')

  const setSearchResults = useSetAtom(saveSearchResultsAtom)

  const getCities = async () => {
    const resp = await fetch(
      'https://www.sahibinden.com/ajax/location/loadCitiesByCountryId?vcIncluded=true&address_country=1',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).then((response) => {
      return response.json()
    })

    console.log(resp.data['1'])

    return resp.data['1']
  }

  const getTownsByCityId = async (cityId: number) => {
    const resp = await fetch(
      `https://www.sahibinden.com/ajax/location/loadTownsByCityIds?address_city=${cityId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).then((response) => {
      return response.json()
    })

    return resp.data[cityId]
  }

  const getDistrictsByTownId = async (townId: number) => {
    const resp = await fetch(
      `https://www.sahibinden.com/ajax/location/loadDistrictsByTownIds?address_town=${townId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).then((response) => {
      return response.json()
    })

    return resp.data[townId]
  }

  useEffect(() => {
    if (captchaSolved) {
      const fetchData = async () => {
        const cities = await getCities()
        setCities(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cities.map((city: any) => ({
            label: city.name,
            value: city.id
          }))
        )
      }

      fetchData()
    }
  }, [captchaSolved])

  const refresh = () => {
    setCaptchaSolved(false)
    setCities([])
    setTowns([])
    setDistricts([])
    setSelectedCity(null)
    setSelectedTown(null)
    setSelectedDistrict([])
    setSearchDescription('')
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 relative">
      {captchaSolved && (
        <span className="absolute right-6 top-3 cursor-pointer" onClick={refresh}>
          <LuRefreshCw size={24} />
        </span>
      )}
      {!captchaSolved && (
        <Button
          className="w-96"
          type="primary"
          onClick={async () => {
            await window.context.solveCaptcha()
            setCaptchaSolved(true)
          }}
        >
          Bot Korumasını Geç
        </Button>
      )}
      <Select
        placeholder="Basic usage"
        options={cities}
        loading={cities.length === 0 && captchaSolved}
        disabled={cities.length === 0}
        className="w-96"
        onSelect={(value) => {
          setSelectedCity(value)
          setSearchDescription((cities.find((city: any) => city.value === value) as any)?.label)
          getTownsByCityId(value!).then((towns) => {
            setTowns(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              towns.map((town: any) => ({
                label: town.name,
                value: town.id
              }))
            )
          })
        }}
        value={selectedCity}
      />
      <Select
        placeholder="Basic usage"
        className="w-96"
        options={towns}
        disabled={!selectedCity}
        loading={towns.length === 0 && selectedCity !== null}
        onSelect={(value) => {
          setSelectedTown(value)
          setSearchDescription(
            searchDescription +
              ' - ' +
              (towns.find((town: any) => town.value === value) as any)?.label
          )
          getDistrictsByTownId(value!).then((districts) => {
            setDistricts(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              districts.map((district: any) => ({
                value: district.id,
                title: district.name,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                children: district.quarters.map((quarter: any) => ({
                  value: district.id + '-' + quarter.id,
                  title: quarter.name
                }))
              }))
            )
          })
        }}
        value={selectedTown}
      />
      <TreeSelect
        showSearch
        disabled={!selectedTown}
        loading={districts.length === 0 && selectedTown !== null}
        className="w-96"
        placeholder="Basic usage"
        treeData={districts}
        onChange={(value) => {
          setSelectedDistrict(value)
        }}
        value={selectedDistrict}
        allowClear
        multiple
        treeDefaultExpandAll
        treeCheckable={true}
        dropdownStyle={{
          maxHeight: 400,
          overflow: 'auto'
        }}
      />
      <Button
        disabled={selectedDistrict.length === 0}
        className="w-96"
        onClick={async () => {
          try {
            const data = await window.context.getSearchResults(
              selectedCity!,
              selectedTown!,
              getUniqueSecondParts(selectedDistrict)
            )
            const newSearch = {
              results: data.map((item) => ({
                ...item,
                il: searchDescription.split(' - ')[0],
                ilce: searchDescription.split(' - ')[1]
              })),
              date: new Date().getTime(),
              description: searchDescription
            }
            await setSearchResults(newSearch)
            refresh()
          } catch (error) {
            console.error(error)
          }
        }}
        type="primary"
      >
        Submit
      </Button>
    </div>
  )
}
