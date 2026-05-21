export let isSearchCancelled = false
export let currentSearchId = 0

export const setSearchCancelled = (val: boolean) => {
  isSearchCancelled = val
}

export const incrementSearchId = () => {
  currentSearchId++
  return currentSearchId
}
