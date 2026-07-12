import { useEffect } from 'react'

export default function ThemeProvider({ children }) {
  // InterviewX uses a single light theme. We no longer follow the
  // OS-level prefers-color-scheme setting; this is intentional.
  useEffect(() => {
    document.documentElement.dataset.theme = 'light'
  }, [])

  return children
}

