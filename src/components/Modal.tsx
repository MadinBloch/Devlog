import React from 'react'

export default function Modal({
  children,
  title,
  subtitle,
  onClose,
  wide,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  onClose?: () => void
  wide?: boolean
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`task-modal ${wide ? 'timer-modal' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="modal-title">
            <div>
              {title && <h2>{title}</h2>}
              {subtitle && <p>{subtitle}</p>}
            </div>
            {onClose && (
              <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
                ×
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
