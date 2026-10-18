# Deployment runbook — AWS Academy Learner Lab

## 1. What is already deployed

Stack `InfrastructureReportingSystem-603AZ` shows `CREATE_COMPLETE`. Your API endpoint is:

`https://edxlwdqmm3.execute-api.us-east-1.amazonaws.com`

CloudFormation Outputs screenshot shows Cognito IDs transcribed into `website/assets/js/config.js`. **Copy the IDs directly from your own AWS console and compare them character by character** before relying on them.

## 2. Enable the required Cognito authentication flow

The original stack's Cognito app client enables `ALLOW_USER_SRP_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH`, but this website uses `USER_PASSWORD_AUTH`. Update the **existing stack** using `cloudformation/updated-stack.yaml` (see `cloudformation/README.md`). This adds `ALLOW_USER_PASSWORD_AUTH`. If the change is denied by Learner Lab, authentication will not work until the app client is configured appropriately. Do not create an entirely new stack.

## 3. Deploy the enhanced Lambda handler

1. Run `python scripts/package_lambda.py` from the repository root.
2. AWS Console → Lambda → find function named like `infrastructure-reports-api-InfrastructureReportingSystem-603AZ`.
3. Code → Upload from → `.zip file` → select `dist/civicpulse-lambda.zip`.
4. Confirm runtime **Python 3.12**, handler **`index.handler`**, and environment variables `REPORTS_TABLE`, `IMAGE_BUCKET`, `SNS_TOPIC` remain set.
5. Deploy and test the function through the real API with a valid Cognito token. Do not test protected routes anonymously and assume a 401 means the backend is broken.
6. If CloudFormation is updated again, the inline Lambda code may be restored; repeat the Lambda upload.

## 4. Deploy website through Amplify

1. Create a GitHub repository and upload the **contents of this project**, preserving the `website/` directory.
2. AWS Console → Amplify → Host web app → GitHub → authorise your repository and select the branch.
3. Use the repository-root `amplify.yml` build settings, with output directory `website`.
4. Configure an SPA rewrite rule if Amplify does not already have one: source `/<*>`, target `/index.html`, type `200 (Rewrite)`; the website uses hash routes and normally does not need a complex rewrite.
5. Wait for the Amplify build and open the HTTPS URL. The stack's optional Amplify resource may not have been created if no GitHub URL/token was provided during CloudFormation creation.
6. If Amplify is blocked in Learner Lab, use a permitted hosting method and HTTPS; do not assume a service is available simply because its console opens.

## 5. Test end to end

- Open homepage; cinematic intro runs once per browser session (skip button and reduced-motion support).
- Create a **Citizen** account, verify email code, sign in, sign out, forgot password, reset password.
- Submit a report with location, category, description, date, priority and a photo.
- Verify report in DynamoDB and image in S3. Check `GET /reports` and detail.
- To test staff, manually assign a test user to the Cognito `Staff` group, then sign out and back in. Staff dashboard should show reports and allow status changes.
- Optionally subscribe an email address to SNS and confirm the subscription before testing notifications.
- Review CloudWatch logs for backend errors; avoid sharing JWTs, passwords or GitHub access tokens.

## 6. Known limitations

No AppSync live subscriptions, automated data deletion, AWS Backup plan, or CloudTrail trail are created by this website package. Staff dashboard refresh is manual; the site does not falsely advertise realtime status push. The prototype has no council integration and does not dispatch real maintenance teams.
