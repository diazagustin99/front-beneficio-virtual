import styles from './EmptyState.module.css'

interface EmptyStateProps {
  message: string
  /** Shows a small spinning indicator above the message — for "Cargando..."
   * states specifically, never for a genuine empty-results message. */
  isLoading?: boolean
}

export function EmptyState({ message, isLoading }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      <p>{message}</p>
    </div>
  )
}
