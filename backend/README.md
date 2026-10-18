# Lambda backend

`index.py` is the enhanced **Python 3.12** handler. It uses `boto3` (available in the Lambda Python runtime) and these environment variables from the existing stack:

- `REPORTS_TABLE`
- `IMAGE_BUCKET`
- `SNS_TOPIC`

Handler: `index.handler`. Upload `index.py` in a ZIP **at the root**, not inside a `backend/` directory. You can create this ZIP with `python scripts/package_lambda.py` from the repository root. The script produces `dist/civicpulse-lambda.zip`.

Existing routes (all protected by API Gateway Cognito JWT authorizer):

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/reports` | Signed-in | Create a report |
| GET | `/reports` | Signed-in | List own reports, or up to 100 reports for Staff |
| GET | `/reports/{id}` | Owner or Staff | View report and temporary image URLs |
| PATCH | `/reports/{id}` | Staff | Change status, assignment, priority and note |
| POST | `/uploads` | Owner or Staff | Get signed image upload URL |

**Note:** The database scan and query return a maximum of 100 items. Proper pagination, rate limiting, image content scanning, deletion/retention, audit trails and data-subject workflows remain production hardening tasks.

Staff membership is controlled **only in Cognito**: Cognito → User pools → your pool → Groups → `Staff` → add approved user. Never allow public self-service selection of Staff.
