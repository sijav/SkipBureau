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
  // The fee for the card of the rule above it, the work permit's too (SB-280).
  cardFee: msg`Card fee`,
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

  // Turkey's general health insurance.
  residenceBeforeRequest: msg`Continuous residence before applying for GSS`,
  coverStartsAfterRequest: msg`GSS registration starts after the request`,
  premiumDaysInPrecedingYear: msg`Contribution days in the preceding year, for routine treatment`,
  premiumRate: msg`GSS premium rate`,
  premiumBase: msg`GSS premium base`,

  // Turkey's work permit, and the duties after it.
  permitFeeUpToOneYear: msg`Fixed-term work permit fee, up to one year`,
  residencePermitIssuedForAtLeast: msg`Minimum issued term of the residence permit`,
  residencePermitValidOn: msg`Required validity date of the residence permit`,
  turkishEmployeesPerForeigner: msg`Turkish employees for each foreigner`,
  paidInCapitalNewBusiness: msg`Paid-in capital for a new business`,
  paidInCapitalEstablishedBusiness: msg`Paid-in capital for an established business`,
  netSalesEstablishedBusiness: msg`Net sales for an established business`,
  exportsEstablishedBusiness: msg`Exports for an established business`,
  salarySeniorExecutivesAndPilots: msg`Minimum salary for senior executives and pilots`,
  salaryEngineersAndArchitects: msg`Minimum salary for engineers and architects`,
  salaryOtherManagers: msg`Minimum salary for other managers`,
  salaryExpertiseOrMastery: msg`Minimum salary for work requiring expertise or mastery`,
  salaryDomesticAndOtherWork: msg`Minimum salary for domestic and other work`,
  grossMinimumWage: msg`Gross minimum wage in 2026`,
  netMinimumWage: msg`Net minimum wage in 2026`,
  reportWithin: msg`Employer’s deadline to notify the Ministry of employment changes`,
  applyWithin: msg`Deadline to apply for a residence permit after a work permit ends`,
  workWhileAssessedAtMost: msg`Maximum work while a timely extension is assessed`,

  // Turkey's limited company, and the duties after forming one.
  minimumCapital: msg`Minimum capital for a limited company`,
  cashCapitalPaidWithin: msg`Deadline to pay cash capital after registration`,
  formationFee: msg`Registry charge on company formation`,
  competitionLevy: msg`Competition Authority levy on subscribed capital`,
  requestAfterCommencement: msg`Deadline to request electronic tax notifications after starting business`,
  firstAfterLiability: msg`Deadline for the first tax certificate after tax liability begins`,
  renewEachYearBy: msg`Annual tax-certificate renewal deadline`,
  renewAfterDeclarationDeadlineInSpecialPeriod: msg`Tax-certificate renewal deadline after the return deadline in a special accounting period`,
  registerBeforeStart: msg`Deadline to register an employee before starting work`,
  obtainBefore: msg`Required time to obtain an opening and operating licence`,
  keptIn: msg`Where the share register and general-meeting minutes are kept`,
  opensWith: msg`Event that opens ETDS`,

  // Germany's residence permit.
  currentTitleWhileDeciding: msg`Your current title while the application is decided`,
  stayWhileDeciding: msg`Your stay while the application is decided`,
  applyInGermanyWithin: msg`Deadline to apply inside Germany`,
  processingTime: msg`Processing time`,
  cardReadyAfterIssuance: msg`Until the card can be collected`,
  onlineConfirmationKeepsTitleValid: msg`Your title, with the online application's confirmation`,
  emergencyTravelWithin: msg`Urgent travel Berlin helps with`,

  // Germany's business registration, and the duties it sets off (SB-300).
  notifyTradeOfficeWhen: msg`When to notify the trade office`,
  lateOrMissingTradeNotificationFine: msg`Fine for a late or missing trade notification`,
  soleTradeRegistrationFee: msg`Registration fee for a sole business`,
  onlineTradeRegistrationFee: msg`Registration fee online`,
  warningFineCanBeChargedAfter: msg`When a warning fine can be charged`,
  fineProceedingsCanStartAfter: msg`When fine proceedings can start`,
  notifyAccidentInsurerWithin: msg`Deadline to notify the accident insurer`,
  sendTaxQuestionnaireWithin: msg`Deadline to send the tax questionnaire`,
  tradeIncomeAllowance: msg`Trade income allowance`,
  contributionExemptionThreshold: msg`Profit below which the chamber contribution is nothing`,
  founderReliefThreshold: msg`Profit ceiling for founder relief`,
  levyBaseAllowance: msg`Allowance deducted from the levy base`,
  previousYearTurnoverThreshold: msg`Turnover ceiling for the previous year`,
  currentYearTurnoverThreshold: msg`Turnover ceiling for the current year`,
  firstYearTurnoverThreshold: msg`Turnover ceiling in the year the business starts`,
  exemptionLostFrom: msg`Transaction losing the exemption`,
  waiverBindsFor: msg`Minimum waiver period`,
  selfEmploymentCountsAsWork: msg`Self-employment under the Residence Act`,
  workOnYourResidenceTitle: msg`Work allowed by your residence title`,

  // Germany's health insurance, and the care insurance on top of it (SB-300).
  generalAnnualEarningsThreshold: msg`Earnings threshold for compulsory insurance`,
  generalContributionRate: msg`General contribution rate`,
  employeeAndEmployerShare: msg`Split of the general and additional contribution`,
  assessmentCeiling: msg`Monthly contribution assessment ceiling`,
  voluntaryMembershipNoticeWithin: msg`Deadline to join voluntarily in your first employment`,
  compulsoryMembershipThroughEmploymentBegins: msg`Start of compulsory membership through employment`,
  careContributionRate: msg`Care insurance contribution rate`,
  childlessCareContributionRate: msg`Care insurance rate for a childless member`,
  careDiscountPerChild: msg`Care insurance discount for each child`,
  employeeCareShare: msg`Employee’s share of the care contribution`,
  employerCareShare: msg`Employer’s share of the care contribution`,
}
