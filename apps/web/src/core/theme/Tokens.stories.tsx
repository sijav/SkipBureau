import { Box, Stack, Typography, useTheme } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { light, radius, spacing, type } from './tokens'

/**
 * Every token, rendered. Switch Mode in the toolbar to see the dark values.
 *
 * This is the story SB-003's exit condition asks for, and it is built by
 * iterating the token object rather than by listing swatches by hand: a token
 * added to `tokens.ts` appears here on its own, and one that is removed cannot
 * linger as a stale swatch.
 */

const Swatch = ({ name }: { name: keyof typeof light }) => {
  const theme = useTheme()
  const value = theme.tokens[name]

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 88,
          height: 56,
          flexShrink: 0,
          bgcolor: value,
          border: 1,
          borderColor: 'divider',
          borderRadius: `${radius.sm}px`,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontFamily: type.label.family, fontWeight: type.label.weight }}>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}

const AllTokens = () => {
  const names = Object.keys(light) as (keyof typeof light)[]

  return (
    <Stack spacing={4} sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box>
        <Typography variant="h3">Colour</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {names.length} tokens. Values change with the Mode toolbar; names never do.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
        {names.map((name) => (
          <Swatch key={name} name={name} />
        ))}
      </Box>

      <Box>
        <Typography variant="h3">Type</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {(Object.keys(type) as (keyof typeof type)[]).map((name) => (
            <Box key={name}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {name} · {type[name].size} / {type[name].line}
              </Typography>
              <Box
                sx={{
                  fontFamily: type[name].family,
                  fontSize: type[name].size,
                  lineHeight: `${type[name].line}px`,
                  fontWeight: type[name].weight,
                  color: 'text.primary',
                }}
              >
                What do you need to do?
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="h3">Spacing</Typography>
        <Stack spacing={1} sx={{ mt: 2 }}>
          {(Object.keys(spacing) as (keyof typeof spacing)[]).map((name) => (
            <Stack key={name} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" sx={{ width: 64, color: 'text.secondary' }}>
                {name} · {spacing[name]}
              </Typography>
              <Box sx={{ height: 16, width: `${spacing[name]}px`, bgcolor: 'primary.main' }} />
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="h3">Radius</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          There is no pill token, on purpose.
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          {(Object.keys(radius) as (keyof typeof radius)[]).map((name) => (
            <Stack key={name} spacing={1} sx={{ alignItems: 'center' }}>
              <Box
                sx={{ width: 64, height: 48, bgcolor: 'primary.main', borderRadius: `${radius[name]}px` }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {name} · {radius[name]}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}

const meta = {
  title: 'Foundations/Tokens',
  component: AllTokens,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AllTokens>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
