# cities, in germany

One conversation, resumed, until both sides are satisfied. SB-167, and the
owner's order of 2026-09-12. Model `gpt-6-astra`, effort high, web search on.

Session `01a0a2a4-f6a2-7921-8d27-e4294f49e731`.

---

## Asked, 2026-09-15 01:20 UTC (first)

The case is the German cities a rule in this product names: München, Düsseldorf, Köln, Wiesbaden and Freiburg im Breisgau. The agreed research found registration free in four of them and a trade registration fee set in Cologne. Each will be stored as a place inside its Land, so that a reader who says they live there is given that city's rule.

This is a list, not a rule. I want each row quoted from an official page, not recalled, and I want to be told plainly where a page does not say what I ask.

Four questions.

1. THE NAMES AND KEYS. Which official page states each of these five municipalities with its official name and its Amtlicher Gemeindeschlüssel, and is it current? Candidates: the Federal Statistical Office's Gemeindeverzeichnis, a Land statistical office's list, or each city's own official site. Prefer a web page to a file that has to be downloaded, and say if only a download has it. Quote each city's row exactly as printed.

2. WHICH NAME. Official lists write some of these with an addition, such as "München, Landeshauptstadt" or "Freiburg im Breisgau, Stadt". Which part is the municipality's name and which is a designation of its status? Say only what an official source supports.

3. THE LAND. For each, confirm the Land it lies in from the same page or another official one, and whether its key's first two digits are that Land's.

4. CHANGES. Has any of the five been renamed or merged, or had its key changed, in the lists you cite?

Keep it short where the answer is short, and end with the URLs you actually opened.

## Answered

## 1. Names and keys

All five have **official HTML entries in the joint statistical offices’ Gemeindeverzeichnis**; no download is needed. These pages display fields vertically, not as table rows. Below, each quoted field is reproduced exactly.

| Name as printed | “Amtl. Gemeindeschlüssel” | “Bundesland” |
|---|---|---|
| “München, Landeshauptstadt” | “09162000” | “Bayern” |
| “Düsseldorf, Stadt” | “05111000” | “Nordrhein-Westfalen” |
| “Köln, Stadt” | “05315000” | “Nordrhein-Westfalen” |
| “Wiesbaden, Landeshauptstadt” | “06414000” | “Hessen” |
| “Freiburg im Breisgau, Stadt” | “08311000” | “Baden-Württemberg” |

Sources: [München](https://www.statistikportal.de/de/gemeindeverzeichnis/09162000), [Düsseldorf](https://www.statistikportal.de/de/gemeindeverzeichnis/05111000), [Köln](https://www.statistikportal.de/de/gemeindeverzeichnis/05315000), [Wiesbaden](https://www.statistikportal.de/de/gemeindeverzeichnis/06414000), [Freiburg](https://www.statistikportal.de/de/gemeindeverzeichnis/08311000).

**Currentness remains unresolved:** every entry prints “Gebietsstand” / “30.09.2026”. That is later than today, **15 September 2026**. I verified what the pages display; I could not verify why they carry a future date or certify them as today’s territorial snapshot.

## 2. Name versus designation

The supported separation is:

| Municipality name | Designation appended in this directory |
|---|---|
| München | Landeshauptstadt |
| Düsseldorf | Stadt |
| Köln | Stadt |
| Wiesbaden | Landeshauptstadt |
| Freiburg im Breisgau | Stadt |

The directory entries themselves **do not explain this separation**. Supporting official sources are:

- **Bayern:** the naming guidance expressly says that *Stadt*, *Markt* and *Landeshauptstadt* are titles, not components of the name. [Bavarian guidance, § 1.1](https://www.gesetze-bayern.de/Content/Document/BayVwV96594/true).
- **Hessen:** the ministry distinguishes the municipality’s name from additional designations and explicitly identifies *Landeshauptstadt* as a designation awarded to Wiesbaden. [Hessian ministry](https://innen.hessen.de/kommunales/kommunen/gemeinden-und-landkreise).
- **NRW and Baden-Württemberg:** their municipal laws distinguish *Name* from *Bezeichnung* and classify *Stadt* as a designation. Applying that distinction to the directory yields the three remaining rows above. [GO NRW § 13](https://recht.nrw.de/lrgv/gesetz/17072025-gemeindeordnung-fuer-das-land-nordrhein-westfalen-go-nrw-bekanntmachung-der/), [GemO BW § 5](https://www.landesrecht-bw.de/bsbw/?docId=jlr-NNLBW00007D3BNN00000000023&query=JURISLINK%3A%22GemO+BW+%C2%A7+5%22).

These are legal naming distinctions, **not evidence of different office practices**.

## 3. Land and key prefix

**Yes, for all five. No regional variation in this encoding rule:** AGS positions 1–2 identify the Land. The official statistical metadata lists **05 = Nordrhein-Westfalen; 06 = Hessen; 08 = Baden-Württemberg; 09 = Bayern**. Each matches the Land independently printed in its city entry. [Official metadata, printed page 6](https://www.forschungsdatenzentrum.de/sites/default/files/bevoelkerung_2011_mdr_teil2_produkt.pdf).

## 4. Changes

**I could not verify rename, merger or key-change histories for any of the five.** The cited city entries contain no change history. The Destatis change-register page failed to load, and I did not inspect its annual change files. Consequently, “no changes” is **not established**, either historically or over a defined recent period.

### URLs opened

Successful retrievals, including the BW page whose substantive text was available through search but did not render on opening:

https://www.statistikportal.de/de/gemeindeverzeichnis/09162000  
https://www.statistikportal.de/de/gemeindeverzeichnis/05111000  
https://www.statistikportal.de/de/gemeindeverzeichnis/05315000  
https://www.statistikportal.de/de/gemeindeverzeichnis/06414000  
https://www.statistikportal.de/de/gemeindeverzeichnis/08311000  
https://www.gesetze-bayern.de/Content/Document/BayVwV96594/true  
https://innen.hessen.de/kommunales/kommunen/gemeinden-und-landkreise  
https://www.forschungsdatenzentrum.de/sites/default/files/bevoelkerung_2011_mdr_teil2_produkt.pdf  
https://recht.nrw.de/lrgv/gesetz/17072025-gemeindeordnung-fuer-das-land-nordrhein-westfalen-go-nrw-bekanntmachung-der/  
https://www.landesrecht-bw.de/bsbw/?docId=jlr-NNLBW00007D3BNN00000000023&query=JURISLINK%3A%22GemO+BW+%C2%A7+5%22  

Attempted opens that failed:

https://www.statistikportal.de/gemeindeverzeichnis/06414000  
https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html  
https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/beschreibung-gebietseinheiten.pdf?__blob=publicationFile  
https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/beschreibung-gebietseinheiten.pdf  
https://forschungsdatenzentrum.de/sites/default/files/bevoelkerung_2011_mdr_teil2_produkt.pdf  
https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Namens-Grenz-Aenderung/namens-grenz-aenderung.html  
https://www.landesrecht-bw.de/perma?j=GemO_BW_!_5

---

## Asked, 2026-09-15 01:23 UTC

Thank you. I have read the five pages myself, fetched as ordinary web pages. Each prints, under "Startseite" and "Gemeindeverzeichnis", the key and then an entry title: "09162000" then "München, Landeshauptstadt"; "05111000" then "Düsseldorf, Stadt"; "05315000" then "Köln, Stadt"; "06414000" then "Wiesbaden, Landeshauptstadt"; "08311000" then "Freiburg im Breisgau, Stadt". Below that come labelled fields, each label on its own line above its value: "Gebietsstand" "30.09.2026", "Bundesland" "Bayern", "Region" "Oberbayern", "Kreis" "München, Landeshauptstadt", "Amtl. Gemeindeschlüssel" "09162000", "Gemeindetyp" "Kreisfreie Stadt", and an address. For Freiburg the "Kreis" field reads "Freiburg im Breisgau, Stadtkreis" while the entry title reads "Freiburg im Breisgau, Stadt". Nothing on any page explains "Gebietsstand".

Four things still open, and only these.

1. GEBIETSSTAND. What does "Gebietsstand" mean in this directory, and why would a page read on 15 September 2026 print 30.09.2026? Answer from an official page of the statistical offices that explains the directory's reference dates, and quote it. If none opens, say so plainly.

2. THE PUBLISHER. Is statistikportal.de the statistical offices' own publication, so that its Gemeindeverzeichnis pages are official pages a product may cite? Quote the page that says who publishes it.

3. THE NAME TO STORE. Given the naming rules you cited, is the name to store for each city the part of the entry title before the comma, München, Düsseldorf, Köln, Wiesbaden and Freiburg im Breisgau, with "im Breisgau" part of Freiburg's name? Say if any official source makes that doubtful.

4. CHANGES. If Destatis's register of name, boundary and key changes opens for you, does it record a change to any of the five since 2000? If it does not open, say so.

Keep it short where the answer is short, and end with the URLs you actually opened.

## Answered

### 1. Gebietsstand

**No official explanation of “Gebietsstand” opened successfully for me.** I located Destatis’s *Qualitätsbericht – Amtlicher Gebietsstand*, but its PDF failed to open. I therefore cannot supply the requested verified quotation explaining the future date.

The directory’s introductory page does open and says:

> “Die Fläche- und Bevölkerungsangaben basieren für alle Bundesländer auf dem Stichtag 31.12.2025.”

That establishes a separate reference date for area and population, **with no regional variation**. It does not explain “Gebietsstand” or why 30.09.2026 appears on 15 September. [Directory introduction](https://www.statistikportal.de/de/gemeindeverzeichnis).

### 2. Publisher

**Yes—these are the statistical offices’ own official pages.** The imprint states:

> “Das Statistikportal wird von den Statistischen Ämtern des Bundes und der Länder gemeinschaftlich entwickelt und betrieben.”

The same page permits reproduction with source attribution and expressly welcomes direct links. SkipBureau may cite the entries. [Imprint](https://www.statistikportal.de/de/impressum).

### 3. Names to store

**Yes, for these five entries**, the previously cited naming rules support:

- München
- Düsseldorf
- Köln
- Wiesbaden
- Freiburg im Breisgau

**“im Breisgau” stays in the name.** *Stadt* and *Landeshauptstadt* are the separately identified designations. No official source examined makes that separation doubtful. This is a conclusion for these five entries, not a universal instruction to remove everything after a comma.

Freiburg’s separate **Kreis** label, “Freiburg im Breisgau, Stadtkreis”, does not contradict its municipality entry title.

### 4. Changes since 2000

**The Destatis change register still did not open.** I cannot establish whether it records a name, boundary or key change affecting any of the five since 2000. “No changes” remains unverified.

### URLs opened this pass

Successfully opened:

https://www.statistikportal.de/de/gemeindeverzeichnis  
https://www.statistikportal.de/de/impressum  

Attempted opens that failed:

https://www.destatis.de/DE/Methoden/Qualitaet/Qualitaetsberichte/Regionales/amtlicher-gebietsstand-2016.pdf?__blob=publicationFile  
https://www.destatis.de/DE/Methoden/Qualitaet/Qualitaetsberichte/Regionales/amtlicher-gebietsstand-2016.pdf  
https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Namens-Grenz-Aenderung/namens-grenz-aenderung.html

---

## Asked, 2026-09-15 01:31 UTC

Thank you. I take from your answer that the portal is the statistical offices' own, that the names to store are the parts of the entry titles before the comma, and that neither the Gebietsstand date nor any change history could be established. I read the naming rules myself: Bavaria's announcement says the designations "Stadt", "Markt" and "Landeshauptstadt" are titles and not part of the name; Hessen's interior ministry says Wiesbaden was given the designation "Landeshauptstadt"; North Rhine-Westphalia's § 13 and Baden-Württemberg's § 5, the latter read in a browser, are headed "Name und Bezeichnung" and give "Stadt" as a designation.

Last turn. Below is what I intend to publish. Do not improve the prose. Name only the sentences that claim more than the evidence supports, and what each should say instead. The definitions at the end quote the pages exactly; say too if a passage does not support the sentence that cites it.

---

# Germany's cities

**Draft for sign-off**, after two turns in `talk/germany/cities.md`. Every name and key below is
quoted from its page, not recalled.

## What a reader is told

**The statistical offices' municipal directory lists each of the five cities with its official
key and its Land**: München in Bayern[^gv-muenchen-09162000], Düsseldorf[^gv-duesseldorf-05111000]
and Köln[^gv-koeln-05315000] in Nordrhein-Westfalen, Wiesbaden in Hessen[^gv-wiesbaden-06414000],
and Freiburg im Breisgau in Baden-Württemberg[^gv-freiburg-08311000]. The statistical offices of
the Federation and the Länder run the directory's portal together[^statistikportal-impressum].

**Each entry title adds "Stadt" or "Landeshauptstadt" after the name, and those are designations,
not part of it.** Bavaria's rules on municipal names say so of both[^by-names-titles]; Hessen's
interior ministry calls "Landeshauptstadt" a designation Wiesbaden was
given[^he-wiesbaden-landeshauptstadt]; and the municipal codes of North Rhine-Westphalia and
Baden-Württemberg treat a municipality's name and its designation "Stadt" separately[^nw-go-13-stadt][^bw-gemo-5-stadt].
So the names are München, Düsseldorf, Köln, Wiesbaden and Freiburg im Breisgau.

**We could not establish** what the directory's "Gebietsstand 30.09.2026" means on pages read on
15 September 2026; the directory dates its area and population figures 31 December
2025[^gv-intro-stichtag]. Nor could we establish whether any of the five has been renamed or had
its key changed, because the register of such changes did not open.

**No regional variation.** These are places, not rules.

## Sources

- <https://www.statistikportal.de/de/gemeindeverzeichnis/09162000>, `05111000`, `05315000`,
  `06414000`, `08311000`
- <https://www.statistikportal.de/de/impressum>, <https://www.statistikportal.de/de/gemeindeverzeichnis>
- <https://www.gesetze-bayern.de/Content/Document/BayVwV96594/true>
- <https://innen.hessen.de/kommunales/kommunen/gemeinden-und-landkreise>
- <https://recht.nrw.de/lrgv/gesetz/17072025-gemeindeordnung-fuer-das-land-nordrhein-westfalen-go-nrw-bekanntmachung-der/>
- <https://www.landesrecht-bw.de/bsbw/document/jlr-NNLBW00007D3BNN00000000023>

[^gv-muenchen-09162000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/09162000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["09162000 München, Landeshauptstadt", "Gebietsstand 30.09.2026", "Bundesland Bayern", "Amtl. Gemeindeschlüssel 09162000"]}

[^gv-duesseldorf-05111000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/05111000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["05111000 Düsseldorf, Stadt", "Gebietsstand 30.09.2026", "Bundesland Nordrhein-Westfalen", "Amtl. Gemeindeschlüssel 05111000"]}

[^gv-koeln-05315000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/05315000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["05315000 Köln, Stadt", "Gebietsstand 30.09.2026", "Bundesland Nordrhein-Westfalen", "Amtl. Gemeindeschlüssel 05315000"]}

[^gv-wiesbaden-06414000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/06414000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["06414000 Wiesbaden, Landeshauptstadt", "Gebietsstand 30.09.2026", "Bundesland Hessen", "Amtl. Gemeindeschlüssel 06414000"]}

[^gv-freiburg-08311000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/08311000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["08311000 Freiburg im Breisgau, Stadt", "Gebietsstand 30.09.2026", "Bundesland Baden-Württemberg", "Amtl. Gemeindeschlüssel 08311000"]}

[^statistikportal-impressum]: <https://www.statistikportal.de/de/impressum> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Impressum, first paragraph", "evidence": ["Das Statistikportal wird von den Statistischen Ämtern des Bundes und der Länder gemeinschaftlich entwickelt und betrieben."]}

[^gv-intro-stichtag]: <https://www.statistikportal.de/de/gemeindeverzeichnis> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis, Wichtige Informationen zur Online-Recherche", "evidence": ["Die Fläche- und Bevölkerungsangaben basieren für alle Bundesländer auf dem Stichtag 31.12.2025."]}

[^by-names-titles]: <https://www.gesetze-bayern.de/Content/Document/BayVwV96594/true> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Bekanntmachung über kommunale Namen, Hoheitszeichen und Gebietsänderungen (NHG-Bek), Nr. 1.1", "evidence": ["Die Bezeichnungen „Stadt“, „Markt“ und „Landeshauptstadt“ nach Art. 3 GO sowie „Große Kreisstadt“ stellen Titel dar, die aufgrund kommunalrechtlicher Vorschriften verliehen werden können, jedoch nicht Namensbestandteil sind."]}

[^he-wiesbaden-landeshauptstadt]: <https://innen.hessen.de/kommunales/kommunen/gemeinden-und-landkreise> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Hessisches Ministerium des Innern, Gemeinden und Landkreise", "evidence": ["Wiesbaden erhielt zum Beispiel die Bezeichnung „Landeshauptstadt“"]}

[^nw-go-13-stadt]: <https://recht.nrw.de/lrgv/gesetz/17072025-gemeindeordnung-fuer-das-land-nordrhein-westfalen-go-nrw-bekanntmachung-der/> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Gemeindeordnung für das Land Nordrhein-Westfalen, § 13 Name und Bezeichnung, Absatz 2", "evidence": ["(2) Die Bezeichnung ,,Stadt\" führen die Gemeinden, denen diese Bezeichnung nach dem bisherigen Recht zusteht."]}

[^bw-gemo-5-stadt]: <https://www.landesrecht-bw.de/bsbw/document/jlr-NNLBW00007D3BNN00000000023> | {"status": "verified", "read": "2026-09-15", "method": "browser pane", "locator": "Gemeindeordnung für Baden-Württemberg, § 5 Name und Bezeichnung, Absätze 1 und 2", "evidence": ["Name und Bezeichnung", "(1) Die Gemeinden führen ihre bisherigen Namen.", "(2) Die Bezeichnung »Stadt« führen die Gemeinden, denen diese Bezeichnung nach bisherigem Recht zusteht."]}

## Answered

- **“No regional variation.”** → **“Regional variation: not applicable to this list of municipalities.”** The evidence establishes municipal identities; it does not establish nationwide uniformity of a rule.

No other sentence exceeds the supplied evidence, and no cited passage fails to support its associated claim.

URLs opened this turn: none.

---

## Asked, 2026-09-15 01:37 UTC

Here is the text as it will be published. The only changes since the last turn: the sentence about regional variation now reads as you worded it, and the first paragraph now says the document is agreed.

One question: is there anything left that claims more than the evidence supports? If there is nothing, say so in one line.

---

# Germany's cities

**Agreed 2026-09-15**, after two turns in `talk/germany/cities.md`. The sign-off turn found one
sentence that claimed more than its evidence, now corrected. Every name and key below is quoted
from its page, not recalled.

## What a reader is told

**The statistical offices' municipal directory lists each of the five cities with its official
key and its Land**: München in Bayern[^gv-muenchen-09162000], Düsseldorf[^gv-duesseldorf-05111000]
and Köln[^gv-koeln-05315000] in Nordrhein-Westfalen, Wiesbaden in Hessen[^gv-wiesbaden-06414000],
and Freiburg im Breisgau in Baden-Württemberg[^gv-freiburg-08311000]. The statistical offices of
the Federation and the Länder run the directory's portal together[^statistikportal-impressum].

**Each entry title adds "Stadt" or "Landeshauptstadt" after the name, and those are designations,
not part of it.** Bavaria's rules on municipal names say so of both[^by-names-titles]; Hessen's
interior ministry calls "Landeshauptstadt" a designation Wiesbaden was
given[^he-wiesbaden-landeshauptstadt]; and the municipal codes of North Rhine-Westphalia and
Baden-Württemberg treat a municipality's name and its designation "Stadt" separately[^nw-go-13-stadt][^bw-gemo-5-stadt].
So the names are München, Düsseldorf, Köln, Wiesbaden and Freiburg im Breisgau.

**We could not establish** what the directory's "Gebietsstand 30.09.2026" means on pages read on
15 September 2026; the directory dates its area and population figures 31 December
2025[^gv-intro-stichtag]. Nor could we establish whether any of the five has been renamed or had
its key changed, because the register of such changes did not open.

**Regional variation: not applicable to this list of municipalities.** These are places, not rules.

## Sources

- <https://www.statistikportal.de/de/gemeindeverzeichnis/09162000>, `05111000`, `05315000`,
  `06414000`, `08311000`
- <https://www.statistikportal.de/de/impressum>, <https://www.statistikportal.de/de/gemeindeverzeichnis>
- <https://www.gesetze-bayern.de/Content/Document/BayVwV96594/true>
- <https://innen.hessen.de/kommunales/kommunen/gemeinden-und-landkreise>
- <https://recht.nrw.de/lrgv/gesetz/17072025-gemeindeordnung-fuer-das-land-nordrhein-westfalen-go-nrw-bekanntmachung-der/>
- <https://www.landesrecht-bw.de/bsbw/document/jlr-NNLBW00007D3BNN00000000023>

[^gv-muenchen-09162000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/09162000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["09162000 München, Landeshauptstadt", "Gebietsstand 30.09.2026", "Bundesland Bayern", "Amtl. Gemeindeschlüssel 09162000"]}

[^gv-duesseldorf-05111000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/05111000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["05111000 Düsseldorf, Stadt", "Gebietsstand 30.09.2026", "Bundesland Nordrhein-Westfalen", "Amtl. Gemeindeschlüssel 05111000"]}

[^gv-koeln-05315000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/05315000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["05315000 Köln, Stadt", "Gebietsstand 30.09.2026", "Bundesland Nordrhein-Westfalen", "Amtl. Gemeindeschlüssel 05315000"]}

[^gv-wiesbaden-06414000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/06414000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["06414000 Wiesbaden, Landeshauptstadt", "Gebietsstand 30.09.2026", "Bundesland Hessen", "Amtl. Gemeindeschlüssel 06414000"]}

[^gv-freiburg-08311000]: <https://www.statistikportal.de/de/gemeindeverzeichnis/08311000> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis: the key and the entry title under the breadcrumb, and the fields Gebietsstand, Bundesland and Amtl. Gemeindeschlüssel, each label and its value on their own lines, joined by a space", "evidence": ["08311000 Freiburg im Breisgau, Stadt", "Gebietsstand 30.09.2026", "Bundesland Baden-Württemberg", "Amtl. Gemeindeschlüssel 08311000"]}

[^statistikportal-impressum]: <https://www.statistikportal.de/de/impressum> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Impressum, first paragraph", "evidence": ["Das Statistikportal wird von den Statistischen Ämtern des Bundes und der Länder gemeinschaftlich entwickelt und betrieben."]}

[^gv-intro-stichtag]: <https://www.statistikportal.de/de/gemeindeverzeichnis> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Statistikportal, Gemeindeverzeichnis, Wichtige Informationen zur Online-Recherche", "evidence": ["Die Fläche- und Bevölkerungsangaben basieren für alle Bundesländer auf dem Stichtag 31.12.2025."]}

[^by-names-titles]: <https://www.gesetze-bayern.de/Content/Document/BayVwV96594/true> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Bekanntmachung über kommunale Namen, Hoheitszeichen und Gebietsänderungen (NHG-Bek), Nr. 1.1", "evidence": ["Die Bezeichnungen „Stadt“, „Markt“ und „Landeshauptstadt“ nach Art. 3 GO sowie „Große Kreisstadt“ stellen Titel dar, die aufgrund kommunalrechtlicher Vorschriften verliehen werden können, jedoch nicht Namensbestandteil sind."]}

[^he-wiesbaden-landeshauptstadt]: <https://innen.hessen.de/kommunales/kommunen/gemeinden-und-landkreise> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Hessisches Ministerium des Innern, Gemeinden und Landkreise", "evidence": ["Wiesbaden erhielt zum Beispiel die Bezeichnung „Landeshauptstadt“"]}

[^nw-go-13-stadt]: <https://recht.nrw.de/lrgv/gesetz/17072025-gemeindeordnung-fuer-das-land-nordrhein-westfalen-go-nrw-bekanntmachung-der/> | {"status": "verified", "read": "2026-09-15", "method": "raw page", "locator": "Gemeindeordnung für das Land Nordrhein-Westfalen, § 13 Name und Bezeichnung, Absatz 2", "evidence": ["(2) Die Bezeichnung ,,Stadt\" führen die Gemeinden, denen diese Bezeichnung nach dem bisherigen Recht zusteht."]}

[^bw-gemo-5-stadt]: <https://www.landesrecht-bw.de/bsbw/document/jlr-NNLBW00007D3BNN00000000023> | {"status": "verified", "read": "2026-09-15", "method": "browser pane", "locator": "Gemeindeordnung für Baden-Württemberg, § 5 Name und Bezeichnung, Absätze 1 und 2", "evidence": ["Name und Bezeichnung", "(1) Die Gemeinden führen ihre bisherigen Namen.", "(2) Die Bezeichnung »Stadt« führen die Gemeinden, denen diese Bezeichnung nach bisherigem Recht zusteht."]}

## Answered

Nothing left claims more than the evidence supports. URLs opened this turn: none.
