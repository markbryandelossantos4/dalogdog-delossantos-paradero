import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ConfirmationDialog } from './ConfirmationDialog'

describe('confirmation dialog', () => {
  it('renders an accessible confirmation with clear cancel and confirm actions', () => {
    const html = renderToStaticMarkup(
      <ConfirmationDialog
        title="Remove Ube Cloud Latte?"
        message="This will remove 2 items from this order."
        cancelLabel="Keep item"
        confirmLabel="Remove item"
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    )

    expect(html).toContain('role="alertdialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('Remove Ube Cloud Latte?')
    expect(html).toContain('This will remove 2 items from this order.')
    expect(html).toContain('Keep item')
    expect(html).toContain('Remove item')
  })
})
