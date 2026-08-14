import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset document and nested dashboard scrolling whenever the route changes. */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.querySelectorAll<HTMLElement>('main, [data-scroll-container]').forEach((element) => {
      element.scrollTop = 0
    })
  }, [pathname, search])

  return null
}
