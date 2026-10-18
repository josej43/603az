# CivicPulse · Infrastructure Reporting & Maintenance Management

A responsive, animated **educational prototype** for citizens to report infrastructure issues and authorised staff to review and manage them. Built for AWS Academy Learner Lab, `us-east-1`.

![Status](https://img.shields.io/badge/project-educational%20prototype-b8f45c)  **Not an official council reporting service.**

## Features

- 2.45-second skippable animated intro, CSS 3D cityscape, pointer-reactive glow, scroll reveals and reduced-motion support.
- Mobile-first homepage, categories, issue form, account dashboard, staff workspace, details, status history, FAQ, About, Privacy and Terms.
- Cognito registration, email confirmation, resend code, login/logout, forgot/reset password and password change API.
- Report fields: title, category, description, street, postcode, observed date, priority, hazard/accessibility flags, optional GPS coordinates, contact preference and up to three photos.
- API Gateway JWT authentication, Lambda ownership/Staff authorization, DynamoDB persistence, S3 presigned uploads and SNS publishing.
- Staff status, assignment, priority, notes, and CSV export of visible results.

## Existing AWS connection

API: `https://edxlwdqmm3.execute-api.us-east-1.amazonaws.com`

The public Cognito IDs have been **transcribed from the supplied CloudFormation screenshot** into `website/assets/js/config.js`. Verify them directly from your stack's Outputs.

## Start locally

```bash
python -m http.server 5173 --directory website
```

Open `http://localhost:5173`. This loads the UI; live authentication needs the Cognito app client update described below and the live lab must be running. Avoid opening `index.html` via `file://`.

## Deploy

1. Read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) completely.
2. Update the existing CloudFormation stack with `cloudformation/updated-stack.yaml` to enable `USER_PASSWORD_AUTH`. Do not create a duplicate stack.
3. Deploy enhanced Lambda code: `python scripts/package_lambda.py`, then upload `dist/civicpulse-lambda.zip` to the existing Lambda function.
4. Push the repository to GitHub, connect it to Amplify and build with the root `amplify.yml`.
5. Test Citizen and Staff workflows end to end.

## Tests

```bash
python -m pytest -q tests
python scripts/check_config.py
```

Tests use fake AWS clients; they **do not** prove deployment works in your lab. Validate the real stack and CloudWatch logs separately.

## Privacy, security and legal

Read [docs/SECURITY.md](docs/SECURITY.md). Draft Terms and Privacy pages must be reviewed and completed by the real project operator before inviting public users. The current website is a demonstration and does not contact any local council or provide emergency services.

## License

See [LICENSE](LICENSE). AWS service names and trademarks remain the property of their respective owners.
