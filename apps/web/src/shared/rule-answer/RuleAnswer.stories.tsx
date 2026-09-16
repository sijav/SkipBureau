import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { RuleAnswer } from './RuleAnswer'

const deadline = {
  key: 'reportAddressChangeWithin',
  label: 'Deadline to register your address',
  value: 'within 2 weeks',
  source: {
    url: 'https://www.gesetze-im-internet.de/bmg/__17.html',
    name: 'Bundesmeldegesetz (BMG), § 17 Anmeldung, Abmeldung',
    checked: '14 Sept 2026',
  },
}

const fine = {
  key: 'lateAddressNotificationFine',
  label: 'Fine for registering late',
  value: 'at most €1,000',
  source: {
    url: 'https://www.gesetze-im-internet.de/bmg/__54.html',
    name: 'Bundesmeldegesetz (BMG), § 54 Bußgeldvorschriften',
    checked: '14 Sept 2026',
  },
}

const fee = {
  key: 'registrationFee',
  label: 'Registration fee',
  value: '€16',
  source: {
    url: 'https://www.hamburg.de/service/info/111142065/n0/',
    name: 'hamburg.de, Umzug nach Hamburg aus dem Ausland melden',
    checked: '14 Sept 2026',
  },
}

/** SB-257: one rule a guide links, answered for the reader or given as the rule for everyone, with each figure's page. The design draws no rule answer. */
const meta = {
  title: 'Shared/RuleAnswer',
  component: RuleAnswer,
  args: {
    title: 'Report your address and any change to it',
    state: 'general',
    lines: [deadline, fine],
    notes: [{ text: 'Register with the registration office within two weeks of moving in.', lang: 'en-US' }],
    asks: 'Where you live',
    onAsk: fn(),
  },
} satisfies Meta<typeof RuleAnswer>

export default meta
type Story = StoryObj<typeof meta>

/** The rule for everyone, with what can change it and a way to say it. */
export const General: Story = {
  play: async ({ canvasElement, args }) => {
    const answer = within(canvasElement)
    // The first story the runner opens can render after its play has started.
    await expect(await answer.findByText('The rule for everyone', {}, { timeout: 5000 })).toBeVisible()
    await expect(answer.getByText('within 2 weeks')).toBeVisible()
    await expect(answer.getByRole('link', { name: /§ 54/ })).toHaveAttribute('href', fine.source.url)
    await expect(answer.getByText(/Where you live can change this/)).toBeVisible()
    await userEvent.click(answer.getByRole('button', { name: 'Tell us' }))
    await expect(args.onAsk).toHaveBeenCalled()
  },
}

/** SB-271: a rule with no version for everyone is never called that; it says what decides the answer, and a way to say it. */
export const AsksFirst: Story = {
  args: { title: 'Pay the residence permit charge', lines: [], notes: [], asks: 'Your nationality' },
  play: async ({ canvasElement, args }) => {
    const answer = within(canvasElement)
    await expect(await answer.findByText(/Your nationality decides the answer/, {}, { timeout: 5000 })).toBeVisible()
    await expect(answer.queryAllByText(/rule for everyone/i)).toHaveLength(0)
    await userEvent.click(answer.getByRole('button', { name: 'Tell us' }))
    await expect(args.onAsk).toHaveBeenCalled()
  },
}

/** The reader's own answer: Hamburg's fee with the federal deadline and fine it takes from the national rule. */
/**
 * SB-300: a detail nothing can take yet, where the card says so plainly and offers no way into a panel that has no row
 * for it. Typed from the component rather than from the meta, whose `onAsk` is a mock that cannot be left out.
 */
export const AsksWhatNothingCanTakeYet: StoryObj<typeof RuleAnswer> = {
  args: { title: 'Register a trade', lines: [], notes: [], asks: 'Where you work', onAsk: undefined },
  play: async ({ canvasElement }) => {
    const answer = within(canvasElement)
    await expect(await answer.findByText(/Where you work decides the answer/, {}, { timeout: 5000 })).toBeVisible()
    await expect(answer.getByText(/We cannot take this detail from you yet/)).toBeVisible()
    await expect(answer.queryByRole('button', { name: 'Tell us' })).toBeNull()
  },
}

export const Answered: Story = {
  args: { state: 'answered', lines: [fee, deadline, fine], asks: undefined },
  play: async ({ canvasElement }) => {
    const answer = within(canvasElement)
    await expect(await answer.findByText('For you', {}, { timeout: 5000 })).toBeVisible()
    await expect(answer.getByText('€16')).toBeVisible()
    await expect(answer.queryByRole('button', { name: 'Tell us' })).toBeNull()
  },
}

/**
 * Two rules apply and neither is more specific: the reason, and no answer picked for the reader.
 *
 * SB-276: and the detail that could settle it, with a way to give it. `asks` and `onAsk` come from the meta, so this
 * state was already being handed both and ignoring them. The wording says "could help" rather than promising a
 * resolution: a detail may narrow the ambiguity and the resolver can still come back needing review.
 */
export const NeedsReview: Story = {
  args: { state: 'needsReview', lines: [], notes: [], reason: 'A student permit and a work permit both apply to what you have said.' },
  play: async ({ canvasElement, args }) => {
    const answer = within(canvasElement)
    await expect(await answer.findByText(/Two rules could apply to you/, {}, { timeout: 5000 })).toBeVisible()
    await expect(answer.getByText(/A student permit and a work permit both apply/)).toBeVisible()
    await expect(answer.getByText(/Where you live could help settle which rule applies/)).toBeVisible()
    await userEvent.click(answer.getByRole('button', { name: 'Tell us' }))
    await expect(args.onAsk).toHaveBeenCalled()
  },
}

/** No rule held applies to what the reader has said. */
export const NoRule: Story = {
  args: { state: 'noRule', lines: [], notes: [], asks: undefined },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/We hold no rule on this/, {}, { timeout: 5000 })).toBeVisible()
  },
}
