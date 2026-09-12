#!/bin/sh
set -u
HEAD='Here is the text again with the corrections from your last pass applied, and with my own commentary about our data model removed entirely, since that was mine to assert and not something you could verify.

One question: is there anything left that claims more than the evidence supports? If there is nothing, say so in one line.

'
for case in turkey/short-term-residence-permit turkey/health-insurance germany/business-registration germany/health-insurance; do
  printf '%s' "$HEAD" > .check.tmp
  cat "agreed/$case.md" >> .check.tmp
  echo "==================== $case"
  python research.py ask --case "$case" --file .check.tmp 2>&1 | tail -14
done
rm -f .check.tmp
