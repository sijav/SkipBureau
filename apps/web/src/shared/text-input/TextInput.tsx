import { FormControl, FormHelperText, FormLabel, OutlinedInput, type OutlinedInputProps } from '@mui/material'
import { useId, type ReactNode } from 'react'

export type TextInputProps = Omit<OutlinedInputProps, 'error' | 'notched' | 'label' | 'size' | 'color' | 'fullWidth'> & {
  label: ReactNode
  helper?: ReactNode
  error?: ReactNode
  'data-testid'?: string | undefined
}

export const TextInput = ({ label, helper, error, disabled, id, 'data-testid': testId, ...input }: TextInputProps) => {
  const generated = useId()
  const inputId = id ?? generated
  const descriptionId = `${inputId}-description`
  const description = error ?? helper

  return (
    // FormControl carries disabled and error to the label, the field and the
    // helper, and makes the input aria-invalid, so no part has to be told.
    <FormControl fullWidth disabled={disabled} error={Boolean(error)} data-testid={testId}>
      <FormLabel htmlFor={inputId}>{label}</FormLabel>
      <OutlinedInput {...input} id={inputId} fullWidth aria-describedby={description ? descriptionId : undefined} />
      {description && <FormHelperText id={descriptionId}>{description}</FormHelperText>}
    </FormControl>
  )
}
