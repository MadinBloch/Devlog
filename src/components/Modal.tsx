import React from 'react'

export default function Modal({
  children,
  title,
  subtitle,
  onClose,
  wide,
  footer,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  onClose?: () => void
  wide?: boolean
  footer?: React.ReactNode
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`task-modal modal-shell ${wide ? 'timer-modal' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="modal-title modal-shell-head">
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
        <div className="modal-shell-body">{children}</div>
        {footer && <div className="modal-shell-footer">{footer}</div>}
      </div>
    </div>
  )
}
