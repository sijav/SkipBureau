#!/bin/sh
# The exit condition: a final pass that raises nothing new. It already caught
# two corrections that never made it out of the sign-off list and into the
# agreed text, so what is under test here is the transcription, not the
# research.
set -u
HEAD='This is the text as it now stands, with every correction you gave me applied. I am not asking for improvements and I am not asking you to look for something. I am asking one question only: is there anything left in it that claims more than the evidence supports, including any correction you gave me that I failed to apply?

If there is nothing, say so plainly in one line. A clean answer is a complete answer and I would rather have it than a manufactured finding. If there is something, name the sentence.

'
for case in turkey/address-registration turkey/short-term-residence-permit turkey/work-permit turkey/company-formation turkey/tax-number turkey/health-insurance germany/anmeldung germany/residence-permit germany/business-registration; do
  file="agreed/$case.md"
  [ -f "$file" ] || { echo "MISSING $file"; continue; }
  printf '%s' "$HEAD" > .check.tmp
  cat "$file" >> .check.tmp
  echo "==================== $case"
  python research.py ask --case "$case" --file .check.tmp 2>&1 | tail -24
done
rm -f .check.tmp
