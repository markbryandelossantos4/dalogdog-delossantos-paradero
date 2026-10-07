import { useEffect, useRef } from 'react'

type Props = {
  title: string
  message: string
  cancelLabel: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmationDialog({ title, message, cancelLabel, confirmLabel, onCancel, onConfirm }: Props) {
  const cancelButton = useRef<HTMLButtonElement>(null)
  const confirmButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelButton.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
      if (event.key === 'Tab' && event.shiftKey && document.activeElement === cancelButton.current) {
        event.preventDefault()
        confirmButton.current?.focus()
      } else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === confirmButton.current) {
        event.preventDefault()
        cancelButton.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onCancel])

  return (
    <div
      className="confirmation-backdrop"
      onClick={(event) => { if (event.target === event.currentTarget) onCancel() }}
    >
      <section
        className="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
      >
        <span className="confirmation-mark" aria-hidden="true">?</span>
        <p className="confirmation-eyebrow">ONE QUICK CHECK</p>
        <h2 id="confirmation-title">{title}</h2>
        <p id="confirmation-message" className="confirmation-message">{message}</p>
        <div className="confirmation-actions">
          <button ref={cancelButton} type="button" className="button button-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button ref={confirmButton} type="button" className="button button-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}
