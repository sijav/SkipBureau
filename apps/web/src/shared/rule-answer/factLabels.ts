import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'

/**
 * What a rule fact is, by its key, for the lines that show a guide's rules
 * (SB-257). Interface text keyed by the research's stable fact keys, each
 * written from the agreed sentence or table heading that states the figure. A
 * fact whose key has none shows no line; factLabels.test.ts fails for any fact
 * of an obligation a guide links that has none.
 */
export const FACT_LABELS: Readonly<Record<string, MessageDescriptor>> = {
  // The address duty.
  reportAddressChangeWithin: msg`Deadline to register your address`,
  lateAddressNotificationFine: msg`Fine for registering late`,
  falseAddressDeclarationFine: msg`Fine for a false address declaration`,
  appointmentBookedThrough: msg`Where the appointment is booked`,
  uetsAccountRequired: msg`A UETS account among the documents`,
  registrationFee: msg`Registration fee`,

  // Turkey's short-term residence permit, and its charge.
  stayOnVisaOrExemption: msg`Longest stay on a visa or visa exemption`,
  returnWhilePendingWithin: msg`Return while your application is pending`,
  cardFee: msg`Residence permit card fee`,
  cardFeeExemptionByNationality: msg`Exemption from the card fee by nationality`,
  healthCoverSpans: msg`What your health cover must cover`,
  policyOutpatientLimitContracted: msg`Outpatient cover, at a provider your insurer has contracted with`,
  policyOutpatientShareContracted: msg`Your share of outpatient care, at a provider your insurer has contracted with`,
  policyInpatientLimitContracted: msg`Inpatient cover, at a provider your insurer has contracted with`,
  policyInpatientShareContracted: msg`Your share of inpatient care, at a provider your insurer has contracted with`,
  policyOutpatientLimitNonContracted: msg`Outpatient cover, at a non-contracted provider or a public hospital outside Annex 1`,
  policyOutpatientShareNonContracted: msg`Your share of outpatient care, at a non-contracted provider or a public hospital outside Annex 1`,
  policyInpatientLimitNonContracted: msg`Inpatient cover, at a non-contracted provider or a public hospital outside Annex 1`,
  policyInpatientShareNonContracted: msg`Your share of inpatient care, at a non-contracted provider or a public hospital outside Annex 1`,
  policyOutpatientLimitAnnexOne: msg`Outpatient cover, at a public hospital named in Annex 1`,
  policyOutpatientShareAnnexOne: msg`Your share of outpatient care, at a public hospital named in Annex 1`,
  policyInpatientLimitAnnexOne: msg`Inpatient cover, at a public hospital named in Annex 1`,
  policyInpatientShareAnnexOne: msg`Your share of inpatient care, at a public hospital named in Annex 1`,
  charge: msg`Residence permit charge`,

  // Germany's residence permit.
  currentTitleWhileDeciding: msg`Your current title while the application is decided`,
  stayWhileDeciding: msg`Your stay while the application is decided`,
  applyInGermanyWithin: msg`Deadline to apply inside Germany`,
  processingTime: msg`Processing time`,
  cardReadyAfterIssuance: msg`Until the card can be collected`,
  onlineConfirmationKeepsTitleValid: msg`Your title, with the online application's confirmation`,
  emergencyTravelWithin: msg`Urgent travel Berlin helps with`,
}
