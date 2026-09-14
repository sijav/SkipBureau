-- SB-168: a country's first-level divisions, which a rule reaches through a
-- residenceRegion or workRegion criterion.

-- CreateTable
CREATE TABLE "Region" (
    "code" VARCHAR(6) NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "RegionText" (
    "regionCode" VARCHAR(6) NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RegionText_pkey" PRIMARY KEY ("regionCode","locale")
);

-- CreateIndex
CREATE INDEX "Region_countryCode_idx" ON "Region"("countryCode");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionText" ADD CONSTRAINT "RegionText_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- A criterion's value is a plain string, so no foreign key can say that a
-- region criterion names a real region. Without this, a mistyped code is a
-- rule that silently never matches, and its reader is given the national rule.
-- Before the row is written: a version's criteria are created after the
-- version, in the same transaction, so the version is already there to read.

CREATE OR REPLACE FUNCTION skipbureau_criterion_names_a_region()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dimension IN ('residenceRegion', 'workRegion') AND NOT EXISTS (
    SELECT 1
    FROM "RuleVersion" version
    JOIN "Region" region ON region."countryCode" = version."countryCode"
    WHERE version.id = NEW."ruleVersionId"
      AND region.code = NEW.value
  ) THEN
    RAISE EXCEPTION
      'A % criterion must name a region of its version''s own country, and % is not one.',
      NEW.dimension, NEW.value;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eligibility_criterion_names_a_region
BEFORE INSERT OR UPDATE ON "EligibilityCriterion"
FOR EACH ROW EXECUTE FUNCTION skipbureau_criterion_names_a_region();

-- A region a criterion names keeps its code and its country. With the history
-- triggers, a region used by a version that has started is therefore permanent:
-- a code entered wrongly is corrected by closing that version and recording a
-- new one, never by editing the region under it. Its names stay editable.

CREATE OR REPLACE FUNCTION skipbureau_region_in_use_keeps_its_code()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE' OR NEW.code <> OLD.code OR NEW."countryCode" <> OLD."countryCode")
    AND EXISTS (
      SELECT 1 FROM "EligibilityCriterion"
      WHERE dimension IN ('residenceRegion', 'workRegion')
        AND value = OLD.code
    ) THEN
    RAISE EXCEPTION
      'Region % is named by a rule''s criteria, so it cannot be deleted or recoded.',
      OLD.code;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER region_in_use_keeps_its_code
BEFORE UPDATE OR DELETE ON "Region"
FOR EACH ROW EXECUTE FUNCTION skipbureau_region_in_use_keeps_its_code();
