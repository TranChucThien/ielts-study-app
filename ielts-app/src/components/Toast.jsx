import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  const toast = useCallback((text) => {
    setMsg(text)
    setVisible(true)
    setTimeout(() => setVisible(false), 2000)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`toast${visible ? ' show' : ''}`}>{msg}</div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
