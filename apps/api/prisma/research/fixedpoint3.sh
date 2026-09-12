#!/bin/sh
set -u
HEAD='Here is the text again. My own commentary about our data model has been removed entirely, since that was mine to assert and not something you could verify, and everything you objected to last time was inside it.

One question: is there anything left that claims more than the evidence supports? If there is nothing, say so in one line.

'
for case in turkey/address-registration turkey/work-permit turkey/company-formation turkey/tax-number germany/anmeldung germany/residence-permit; do
  printf '%s' "$HEAD" > .check.tmp
  cat "agreed/$case.md" >> .check.tmp
  echo "==================== $case"
  python research.py ask --case "$case" --file .check.tmp 2>&1 | tail -12
done
rm -f .check.tmp
