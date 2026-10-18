# API contract

Base URL: `https://edxlwdqmm3.execute-api.us-east-1.amazonaws.com`

All five endpoints require `Authorization: Bearer <Cognito ID token>`. This JWT is validated by the existing API Gateway HTTP API JWT authorizer; it is not an API key. Do not expose a Lambda function URL as a shortcut around authentication.

### Create report
`POST /reports` JSON: `{ "title": "Broken streetlight", "category": "Street Lighting", "description": "Streetlight has been off for three nights", "location": "High Street", "postcode": "", "incidentDate": "2026-10-18", "priority": "Medium", "hazard": false, "accessibility": false, "contactPreference": "Account" }`. Returns 201 and report with UUID.

### List reports
`GET /reports`: `{ "items": [...], "hasMore": false }` after enhanced Lambda deployment. Citizens see their own items; Staff see up to 100 items. The original inline Lambda returns `nextKey` instead of `hasMore`.

### Get report
`GET /reports/{id}`: returns the report with `imageUrls` (temporary signed S3 GET URLs) **only after the enhanced Lambda is deployed**.

### Update report
`PATCH /reports/{id}` (Staff only): `{ "status": "In Progress", "assignedTo": "Road Maintenance Team", "priority": "High", "note": "Scheduled inspection" }`.

### Upload photo
`POST /uploads`: `{ "reportId": "UUID", "contentType": "image/jpeg" }` → `{ "uploadUrl": "https://...", "imageKey": "reports/..." }`. Upload file bytes to `uploadUrl` with `PUT` and matching `Content-Type`. Only JPEG/PNG/WebP, maximum 3 per report in enhanced Lambda; browser enforces 5 MB per file (not a server-side content-length limit).

## Status values
Submitted, Under Review, Assigned, In Progress, Resolved, Rejected.

## Security
Do not put tokens in URLs or logs. Cognito `Staff` group membership is administrator-controlled. The client does not determine authorization; Lambda rechecks staff membership from verified JWT claims.
