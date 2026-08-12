import '@testing-library/jest-dom/vitest'

const createStorage = (): Storage => {
  let items: Record<string, string> = {}

  return {
    get length() {
      return Object.keys(items).length
    },
    clear: () => {
      items = {}
    },
    getItem: (key: string) => items[key] ?? null,
    key: (index: number) => Object.keys(items)[index] ?? null,
    removeItem: (key: string) => {
      delete items[key]
    },
    setItem: (key: string, value: string) => {
      items[key] = String(value)
    },
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: createStorage(),
})
