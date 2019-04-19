import { useState, useEffect } from 'react'

// prefix for localStorage
const GLOBALSTORAGE_PREFIX = '[@kwhitley/use-store]'

// individual Store implementation for tracking values/setters
export class Store {
  constructor({ value, namespace, options }) {
    this.state = value

    if (options.persist) {
      try {
        let stored = localStorage.getItem(GLOBALSTORAGE_PREFIX + namespace)
        if (stored !== null) {
          // console.log(GLOBALSTORAGE_PREFIX + namespace, 'found in localStorage, setting to', this.state)
          this.state = JSON.parse(stored)
        } else {
          // console.warn(GLOBALSTORAGE_PREFIX + namespace, 'not found in localStorage, setting to', this.state)
        }
      } catch(err) {
        // console.warn(GLOBALSTORAGE_PREFIX + namespace, 'not found in localStorage, setting to', this.state)
      }
    }

    this.options = options
    this.namespace = namespace
    this.setters = []
  }

  setState = (value) => {
    this.state = value
    if (this.options.persist) {
      // console.log('should persist value', value, 'to namespace', GLOBALSTORAGE_PREFIX + this.namespace)
      localStorage.setItem(GLOBALSTORAGE_PREFIX + this.namespace, JSON.stringify(value))
    }
    this.setters.forEach(setter => setter(this.state))
  }
}

// namespaced index of requested Stores
export class GlobalStore {
  set = (namespace, value, options = {}) => {
    if (this.hasOwnProperty(namespace)) {
      this[namespace].setState(value)
    } else {
      this[namespace] = new Store({ value, options, namespace })
    }
  }

  clear = (namespace) => {
    localStorage.removeItem(GLOBALSTORAGE_PREFIX + namespace)
  }

  persist = (...args) => this.set(...args, { persist: true })
}

// shared instantiation of GlobalStore
export const globalStore = new GlobalStore()

// the actual hook
export function useStore(namespace, value, options = {}) {
  let whichStore = undefined

  if (!namespace) {
    throw new Error('no namespace provided to useStore... try using useState() instead?')
  }

  if (globalStore.hasOwnProperty(namespace)) {
    whichStore = globalStore[namespace]
  } else {
    whichStore = globalStore[namespace] = new Store({ value, options, namespace })
  }

  const [ state, set ] = useState(whichStore.state)

  if (!whichStore.setters.includes(set)) {
    whichStore.setters.push(set)
  }

  useEffect(() => () => {
    whichStore.setters = whichStore.setters.filter(setter => setter !== set)
  }, [])

  return [ state, whichStore.setState ]
}
