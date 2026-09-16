import { ClickAwayListener, Popper } from '@mui/material'
import { ContextPanel, type ContextPanelProps } from './ContextPanel'

export type ContextPopperProps = ContextPanelProps & {
  anchor: HTMLButtonElement | null
  /** SB-275: whether closing should put focus back where it was when the panel opened. */
  onClose: (restoreFocus: boolean) => void
}

// Its own file, which the barrel does not export, so its code and the Popper's
// arrive only when YourDetails first opens it (SB-159).
export const ContextPopper = ({ anchor, onClose, ...panel }: ContextPopperProps) => (
  <Popper open anchorEl={anchor} placement="bottom-end" modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]} sx={{ zIndex: 'modal' }}>
    <ClickAwayListener
      onClickAway={(event) => {
        // The control toggles the panel itself.
        if (event.target instanceof Node && anchor?.contains(event.target)) return
        // SB-275: no restore. MUI fires this on the trailing click, after the reader has already pressed
        // something else, so putting focus back would take it from a target they chose on purpose.
        onClose(false)
      }}
    >
      <div
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return
          // SB-275: the shell puts focus back on whatever opened the panel, which is not always this anchor:
          // a rule's Tell us on the page opens it too. Focusing the anchor here would fight that.
          onClose(true)
        }}
      >
        <ContextPanel {...panel} />
      </div>
    </ClickAwayListener>
  </Popper>
)
