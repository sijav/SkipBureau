import { ClickAwayListener, Popper } from '@mui/material'
import { ContextPanel, type ContextPanelProps } from './ContextPanel'

export type ContextPopperProps = ContextPanelProps & {
  /** The control it opens beneath, which toggles it itself. */
  anchor: HTMLButtonElement | null
  onClose: () => void
}

/**
 * The context panel, open beneath its control: a click elsewhere or Escape
 * puts it away. Its own file, which the barrel does not export, so its code
 * and the Popper's arrive only when YourDetails first opens it (SB-159).
 */
export const ContextPopper = ({ anchor, onClose, ...panel }: ContextPopperProps) => (
  <Popper open anchorEl={anchor} placement="bottom-end" modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]} sx={{ zIndex: 'modal' }}>
    <ClickAwayListener
      onClickAway={(event) => {
        // The control toggles the panel itself.
        if (event.target instanceof Node && anchor?.contains(event.target)) return
        onClose()
      }}
    >
      <div
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return
          onClose()
          anchor?.focus()
        }}
      >
        <ContextPanel {...panel} />
      </div>
    </ClickAwayListener>
  </Popper>
)
