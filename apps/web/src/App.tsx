import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

/**
 * The scaffold's only screen. It exists so `npm run dev` proves the toolchain
 * works end to end; the real screens are SB-012 and they come after the
 * component library, which is the order the owner set.
 */
export const App = () => (
  <Box component="main" sx={{ p: 4 }}>
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      <Typography variant="h4" component="h1">
        SkipBureau
      </Typography>
      <Typography>
        A step-by-step guide to bureaucracy abroad, for travellers and expats. Nothing is built yet: this page exists to
        prove the scaffold runs.
      </Typography>
    </Stack>
  </Box>
)
