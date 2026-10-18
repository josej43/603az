# Security and production-readiness notes

- **Demo only.** The app is not a government service. Do not use it for emergencies or production personal data until security and privacy review.
- Tokens are held in `sessionStorage` for this prototype; XSS is a concern for any browser-token storage. Use a reviewed BFF/HttpOnly-cookie architecture for higher-risk production deployments.
- HTTPS is required for Amplify-hosted access. Avoid opening local files using `file://`; use a local web server for development.
- Existing Cognito User Pool Client must allow `USER_PASSWORD_AUTH`. Staff roles are assigned only in the Cognito console.
- Public user registration does not grant staff access. API Gateway JWT validation and Lambda owner/staff checks protect report data.
- S3 bucket is private. Temporary signed URLs grant limited access. The browser checks file size and MIME type, but S3 presigned PUT does **not** itself enforce a 5 MB maximum or verify actual image content. Add upload scanning and server-side validation before production.
- CORS `*` on the original API/S3 bucket is not an authorization mechanism. Restrict origins to the Amplify domain when known.
- Original Lambda role is shared `LabRole` and may be overprivileged. Least-privilege role management is restricted by AWS Academy.
- SNS notifications are optional and require confirmed subscription. Failed SNS sends are logged; they are not guaranteed.
- A privacy notice draft is provided. It requires actual controller details, legal basis, retention rules, UK GDPR transfer assessment, data-subject processes and institutional review before public use.
- No real-time AppSync subscription, CloudTrail trail, CloudFront custom distribution, AWS Backup plan, staff invitation workflow, image virus scan, delete-account workflow, rate limiting or report pagination is implemented in this code package. These should not be represented as deployed features.
- Disable/remove test accounts and reports when the educational lab ends. Never commit secrets or credentials.
