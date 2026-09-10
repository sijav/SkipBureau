import { Box, FormControl, FormLabel, MenuItem, Select, useTheme } from '@mui/material'
import { useId, type ReactNode } from 'react'
import { FIELD_TEXT } from 'src/core/theme'

export type SelectOption = { value: string; label: ReactNode }

export type SelectFieldProps = {
  /**
   * Required. The design: a select always carries its own label, because a
   * placeholder standing in for one disappears the moment a value is chosen.
   */
  label: ReactNode
  options: readonly SelectOption[]
  /** The chosen option's value, or '' for none. */
  value: string
  onChange: (value: string) => void
  placeholder?: ReactNode
  disabled?: boolean | undefined
  'data-testid'?: string | undefined
}

export const SelectField = ({ label, options, value, onChange, placeholder, disabled, 'data-testid': testId }: SelectFieldProps) => {
  const labelId = useId()
  const { tokens } = useTheme()

  return (
    <FormControl fullWidth disabled={disabled} data-testid={testId}>
      <FormLabel id={labelId}>{label}</FormLabel>
      <Select
        labelId={labelId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        displayEmpty
        renderValue={(chosen) =>
          chosen === '' ? (
            // Disabled, it inherits the field's disabled colour, as Figma draws it.
            <Box component="span" sx={{ color: disabled ? 'inherit' : tokens[FIELD_TEXT.placeholder] }}>
              {placeholder}
            </Box>
          ) : (
            options.find((option) => option.value === chosen)?.label
          )
        }
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
