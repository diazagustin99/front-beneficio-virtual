import { useCallback, useEffect, useState } from 'react'
import type { AppNotification } from '../../api/types'
import { getPreferenceNotifications, markNotificationRead } from '../../api/preferences'

export function useNotifications(token: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    getPreferenceNotifications(token, 1)
      .then((result) => {
        if (!cancelled) {
          setNotifications(result.items)
          setPage(result.currentPage)
          setTotalPages(result.totalPages)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotifications([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const loadMore = useCallback(() => {
    if (isLoadingMore || page >= totalPages) {
      return
    }

    setIsLoadingMore(true)

    getPreferenceNotifications(token, page + 1)
      .then((result) => {
        setNotifications((current) => [...current, ...result.items])
        setPage(result.currentPage)
        setTotalPages(result.totalPages)
      })
      .catch(() => {})
      .finally(() => setIsLoadingMore(false))
  }, [token, page, totalPages, isLoadingMore])

  const markRead = useCallback(
    (id: string) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, read_at: new Date().toISOString() } : notification,
        ),
      )
      markNotificationRead(token, id).catch(() => {})
    },
    [token],
  )

  return {
    notifications,
    isLoading,
    isLoadingMore,
    hasMore: page < totalPages,
    loadMore,
    markRead,
  }
}
