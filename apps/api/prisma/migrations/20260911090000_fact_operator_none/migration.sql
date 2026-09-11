-- SB-082: a fact can say "checked, and there is none", which a missing row
-- cannot, because a missing row also means nobody looked.
ALTER TYPE "FactOperator" ADD VALUE 'none';
