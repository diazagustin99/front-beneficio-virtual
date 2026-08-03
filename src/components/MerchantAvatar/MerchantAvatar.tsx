import { useState } from 'react'
import { getInitials, pickAvatarColor } from '../../utils/avatarColor'
import styles from './MerchantAvatar.module.css'

interface MerchantAvatarProps {
  name: string
  logoUrl?: string | null
  size?: number
  className?: string
}

/**
 * The real logo (`logoUrl`) always wins when the merchant has one — the
 * colored-initials look is only a fallback for merchants without one, not
 * a stylistic default.
 */
export function MerchantAvatar({ name, logoUrl, size = 44, className }: MerchantAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(logoUrl) && !imageFailed

  return (
    <span
      className={`${styles.avatar} ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        backgroundColor: showImage ? undefined : pickAvatarColor(name),
      }}
    >
      {showImage ? (
        <img
          src={logoUrl ?? undefined}
          alt=""
          loading="lazy"
          className={styles.logo}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={styles.initials} aria-hidden="true" style={{ fontSize: size * 0.4 }}>
          {getInitials(name)}
        </span>
      )}
    </span>
  )
}
