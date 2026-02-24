# Reports - Unified Guide

This document consolidates the previous reports documentation and explains the recent changes made to CSV report generation, fixes applied, and guidance for adding reports for other standards.

## Summary of changes made

- ISO 7101 compliance CSV ordering: fixed canonical numeric ordering by using `clause_major` and `clause_minor` fields instead of lexicographic ordering. This prevents incorrect ordering like `10.1` appearing before `2.1`.
- ISO 7101 risks CSV: expanded exported fields to include `risk_id`, `existing_control`, `treatment_action`, `owner`, `status`, `review_date`, and `archived` so the CSV now contains the full risk record.
- ISO 27001 compliance CSV: made ordering robust and added `Comments`, `Last Updated`, and `Has Evidence` columns to match the ISO-7101 compliance CSV layout.
- ISO 27001 risks CSV: enriched output to include control codes, treatment, owner, status, control coverage and linked asset name.
- The Statement of Applicability (SoA) CSV was intentionally not modified — it is working as expected.

## Why these changes

- The `ComplianceClause.clause_number` field is a string; relying on string order produced incorrect clause sequences. The model stores `clause_major` and `clause_minor` which are numeric and indexed; use them for correct ordering.
- Risk models for different standards store different fields. To make CSV exports more useful, risk exports now include all relevant columns available on the model (owner, status, review date, archived, etc.).
- Some database-side ordering helpers using `Substr` and `Cast` can be fragile across DB backends (SQLite vs Postgres). Using model numeric fields is more reliable.

## Files changed

- `backend/api/reports.py` — fixed clause ordering for ISO-7101 and expanded `risks_csv` columns.
- `backend/api/reports_27001.py` — updated `iso27001_compliance_csv` and `iso27001_risks_csv` to include more fields and use numeric ordering.
- `REPORTS.md` — this merged documentation file.

## CSV behaviour now

- ISO-7101 compliance CSV columns: `Clause Number`, `Description`, `Status`, `Owner`, `Comments`, `Last Updated`, `Has Evidence`.
- ISO-7101 risks CSV columns: `Risk ID`, `Description`, `Likelihood`, `Impact`, `Risk Score`, `Risk Level`, `Existing Control`, `Treatment Action`, `Owner`, `Status`, `Review Date`, `Archived`.
- ISO-27001 compliance CSV columns: `Clause`, `Description`, `Status`, `Owner`, `Comments`, `Last Updated`, `Has Evidence`.
- ISO-27001 risks CSV columns: `Risk ID`, `Risk`, `Likelihood`, `Impact`, `Score`, `Level`, `Existing Control(s)`, `Treatment`, `Owner`, `Status`, `Control Coverage`, `Asset`.

## Known notes / future work

- The `compliance_pdf` endpoint currently returns an error if `reportlab` is not installed. Per request, the PDF feature can be removed or its dependency documented/managed later. No changes were made to the PDF endpoint in this pass.
- The SoA CSV is confirmed as-is and was deliberately not changed.

## How to add CSV reports for another standard

1. Add/ensure your standard's records populate the generic `ComplianceClause` model (set `standard` column). Ensure `clause_major` and `clause_minor` are set or will be parsed on save.
2. Create a new view function in `backend/api/reports_*.py` following the pattern:

```python
def mystandard_compliance_csv(request):
    filename = f"compliance_mystandard_{datetime.utcnow():%Y%m%d_%H%M%S}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow(["Clause Number", "Description", "Status", "Owner", "Comments", "Last Updated", "Has Evidence"])

    qs = ComplianceClause.objects.filter(standard="my-standard").order_by("clause_major", "clause_minor")
    for c in qs:
        writer.writerow([...])
    return response
```

3. If the standard has a separate risk model (like `ISORisk`), add a corresponding `*_risks_csv` that exports the fields relevant to that model.
4. Wire the new endpoints into the `urls.py` routing and update the frontend download links.

## Verification

- Manual checks: download CSVs for ISO-7101 and ISO-27001 and verify clause ordering and presence of new columns.

If you want, I can run a quick local export (if you have the environment up) or wire the frontend download buttons to ensure the new CSV endpoints are reachable. Would you like me to update the frontend `reports` page download labels as a follow-up?
