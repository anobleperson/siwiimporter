## Import Form — Canoe123

The Import tab in the main form (`frmCanoe123.cs`) lets you paste spreadsheet/CSV
data into a grid, assign each column a meaning via a dropdown chooser, then
save into Participants or the Start List.

**Key locations:**
- Designer/controls: `frmCanoe123.cs:1430-1456` — `tabImport`, `gridImport`, `cmbImportColumnChooser`
- Column list definition: `frmCanoe123.cs:25546-25568` (`gridImport_MouseClick`)
- Column → field mapping: `frmCanoe123.cs:25877-26100` (`toolImportSavetoParticipants_Click`)
- Display text resources: `LocStrings.resx`

### Acceptable Import Columns

| Column label (UI) | Resource key | Maps to | Notes |
|---|---|---|---|
| Undefined | `colUndefined` | (ignored) | default/unassigned column |
| Family Name | `colFamilyName` | `Participants.FamilyName` | **required** |
| G.Name | `colGivenName` | `Participants.GivenName` | |
| 2nd Family Name | `colFamilyName2` | `Participants.FamilyName2` | 2nd crew member (C2/K2) |
| 2nd G. Name | `colGivenName2` | `Participants.GivenName2` | 2nd crew member |
| Name | `colName` | listed as an option but not handled in the save-mapping switch | |
| Ctry. | `colNOC` | `Participants.NOC` | nation code |
| Birthdate | `colBirthdate` | `Participants.Birthdate` | parsed via `DateTime.TryParse` |
| Year of Birth | `colYear` | `Participants.Year` | parsed via `int.TryParse`; used for category calc if Birthdate absent |
| Club | `colClub` | `Participants.Club` | |
| Class | `colClass` | `Participants.ClassId` | **required**; auto-detects C2 crews (`"C2"`/`"C 2"`/`"C-2"`) to pull row+1 as 2nd crew member when "C2 Mode" toggle is on |
| Category | `colCategory` | `Participants.CatId` | if omitted, auto-computed from class + birth year via `FindCategory` |
| Id | `colId` | `Participants.Id` | only used if `IDHandling` isn't `INTERNAL`, otherwise auto-generated |
| Bib\No. | `colBib` | `Participants.EventBib` | also used for `Results.bib` when saving to start list |
| Ranking | `colRanking` | `Participants.Ranking` | |
| Start\Order | `colStartOrder` | `Results.startorder` | only relevant for "Save to Start List" |
| Group1–Group4 | (literal, no resource key) | staged into a local array, not written to `Participants` | |

**Required fields:** Family Name and Class — if either isn't assigned, save is
blocked with `msgFamilyNameAndClassRequired` (`frmCanoe123.cs:25913-25917`).

### Separate: ICF Entries Import

`clsICFEntriesImporter.cs` handles a different, file-based import: a
semicolon-delimited ICF-format file with fixed sections:
- `[Athletes]` — ID;Name;FName;NAT;DOB;FID;FILE;Gender
- `[Boats]` — Nat;Tag;EventId;A1;A2;...
- `[Events]` — EvNr;EventId
