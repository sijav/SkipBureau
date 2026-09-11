import { Box, InputBase, useTheme } from '@mui/material'
import { SEARCH_PAINT, searchStyle } from 'src/core/theme'
import { SearchIcon } from './SearchIcon'

export type SearchInputProps = {
  label: string
  placeholder?: string | undefined
  value: string
  onChange: (value: string) => void
  onSubmit: (query: string) => void
  'data-testid'?: string | undefined
}

export const SearchInput = ({ label, placeholder, value, onChange, onSubmit, 'data-testid': testId }: SearchInputProps) => {
  const theme = useTheme()
  const { tokens } = theme

  return (
    <Box
      component="form"
      role="search"
      // The landmark takes the field's name, so a page's landmark list reads
      // it, not a bare "search".
      aria-label={label}
      data-testid={testId}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(value)
      }}
    >
      <InputBase
        type="search"
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        // Body Large, the design's serif, which asks for a sentence.
        sx={searchStyle(tokens, theme.typography.subtitle1)}
        slotProps={{ input: { 'aria-label': label, enterKeyHint: 'search' } }}
        startAdornment={
          <SearchIcon
            aria-hidden
            sx={{ width: '18px', height: '18px', flexShrink: 0, color: tokens[value ? SEARCH_PAINT.iconFilled : SEARCH_PAINT.icon] }}
          />
        }
      />
    </Box>
  )
}
