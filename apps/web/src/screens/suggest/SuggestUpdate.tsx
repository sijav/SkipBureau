import { Trans, useLingui } from '@lingui/react/macro'
import { alpha, Box, Button, Dialog, Stack, Typography, useTheme } from '@mui/material'
import { useId, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from 'urql'
import { useCountry } from 'src/core/country'
import { SuggestUpdateMutation } from 'src/core/graphql'
import { useLocale } from 'src/core/i18n'
import { paths } from 'src/core/router'
import { radius, spacing } from 'src/core/theme'
import { TextInput } from 'src/shared/text-input'
import { Guide } from 'src/screens/guide'

type Problem = 'change' | 'source' | 'email' | 'unsent'

const STROKE = 1

/**
 * Figma 145:865: suggesting an update, over the guide it is about. What is sent
 * is stored for an editor and never edits the guide; there is no account, and
 * the email is only for following up. Closing returns to the guide.
 *
 * Two siblings, not one component: the form's state lives in the dialog, so a
 * keystroke re-renders the form and not the whole guide behind it.
 */
export const SuggestUpdate = () => (
  <>
    <Guide />
    <SuggestDialog />
  </>
)

const SuggestDialog = () => {
  const { tokens } = useTheme()
  const { t } = useLingui()
  const { locale } = useLocale()
  const { country } = useCountry()
  const { guide = '' } = useParams()
  const navigate = useNavigate()
  const title = useId()

  const [change, setChange] = useState('')
  const [source, setSource] = useState('')
  const [email, setEmail] = useState('')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [sent, setSent] = useState(false)
  const [{ fetching }, send] = useMutation(SuggestUpdateMutation)

  const back = () => void navigate(paths.guide(locale, country, guide))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!change.trim()) {
      setProblem('change')
      return
    }
    const result = await send({ input: { country, guide, locale, change, source: source || null, email: email || null } })
    const answer = result.data?.suggestUpdate
    if (answer?.received) {
      setSent(true)
      return
    }
    const named = answer?.problem
    setProblem(named === 'change' || named === 'source' || named === 'email' ? named : 'unsent')
  }

  return (
    <Dialog
      open
      onClose={back}
      aria-labelledby={title}
      slotProps={{
        backdrop: { sx: { backgroundColor: alpha(tokens.textPrimary, 0.24) } },
        paper: {
          sx: {
            width: '100%',
            maxWidth: '560px',
            margin: `${spacing.md}px`,
            padding: `${spacing.xl - STROKE}px`,
            border: `${STROKE}px solid ${tokens.border}`,
            borderRadius: `${radius.sm}px`,
            backgroundColor: tokens.surface,
            backgroundImage: 'none',
            boxShadow: `0 16px 40px -12px ${alpha(tokens.textPrimary, 0.1)}, 0 2px 4px 0 ${alpha(tokens.textPrimary, 0.06)}`,
          },
        },
      }}
    >
      {sent ? (
        <Stack spacing="20px">
          <Stack spacing="6px">
            <Typography id={title} variant="h4" component="h2">
              <Trans>Thank you</Trans>
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
              <Trans>We’ll review your suggestion before updating the guide.</Trans>
            </Typography>
          </Stack>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={back}>
              <Trans>Back to the guide</Trans>
            </Button>
          </Box>
        </Stack>
      ) : (
        <Stack component="form" noValidate spacing="20px" onSubmit={(event) => void submit(event)}>
          <Stack spacing="6px">
            <Typography id={title} variant="h4" component="h2">
              <Trans>Suggest an update</Trans>
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
              <Trans>
                We’ll review your suggestion before updating the guide. Submitting information does not directly change the published guide.
              </Trans>
            </Typography>
          </Stack>

          <TextInput
            label={<Trans>What changed?</Trans>}
            placeholder={t`Describe what changed`}
            multiline
            minRows={4}
            required
            value={change}
            onChange={(event) => setChange(event.target.value)}
            helper={<Trans>Tell us what looks outdated, incorrect or missing.</Trans>}
            error={problem === 'change' ? <Trans>Describe what changed, even in one sentence.</Trans> : undefined}
          />
          <TextInput
            label={<Trans>Source or link (optional)</Trans>}
            placeholder={t`Paste a link if you have one`}
            value={source}
            onChange={(event) => setSource(event.target.value)}
            helper={<Trans>Official or reliable sources help us verify the change faster.</Trans>}
            error={problem === 'source' ? <Trans>Shorten the link, or paste only the address of the page.</Trans> : undefined}
          />
          <TextInput
            label={<Trans>Your email</Trans>}
            placeholder={t`you@example.com`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            helper={<Trans>We may contact you if we need more information. Your email will not be published.</Trans>}
            error={problem === 'email' ? <Trans>Check the address: it needs an @ and a domain, like you@example.com.</Trans> : undefined}
          />

          <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
            <Trans>We use your email only to review and follow up on this submission.</Trans>
          </Typography>

          {problem === 'unsent' && (
            <Typography role="alert" variant="body2" sx={{ color: tokens.dangerText }}>
              <Trans>It was not sent. Check your connection and try again.</Trans>
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px', flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ flex: '1 0 0', minWidth: 0, color: tokens.textSecondary }}>
              <Trans>No account needed</Trans>
            </Typography>
            <Button variant="ghost" onClick={back}>
              <Trans>Cancel</Trans>
            </Button>
            <Button variant="primary" type="submit" disabled={fetching}>
              <Trans>Send suggestion</Trans>
            </Button>
          </Box>
        </Stack>
      )}
    </Dialog>
  )
}
