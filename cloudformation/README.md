# CloudFormation update instructions

`original-stack.yaml` is the original deployed infrastructure template supplied earlier. `updated-stack.yaml` adds **ALLOW_USER_PASSWORD_AUTH** to the existing Cognito User Pool Client, which is required by this website's direct Cognito sign-in code. The updated template does **not** create new IAM roles or policies.

1. AWS CloudFormation → `InfrastructureReportingSystem-603AZ` → **Update** → Replace existing template → upload `updated-stack.yaml`.
2. Keep the same parameters, especially the current **LabRole ARN**. Do not enter secrets in public fields.
3. Inspect the change set before executing. It should update the Cognito client. **CloudFormation can also reapply the original inline Lambda code**; that is why you should upload `backend/index.py` to Lambda **after** the CloudFormation update.
4. Check the User Pool App Client → Authentication flows for `ALLOW_USER_PASSWORD_AUTH` / `USER_PASSWORD_AUTH` support.
5. If AWS Academy rejects the update, **do not repeatedly recreate the stack**. Capture the first CloudFormation Events error and resolve lab permissions before proceeding.

**Do not create a second copy of this stack** unless you deliberately want duplicate resources. DynamoDB and S3 use Retain policies; deleting a stack does not necessarily delete its data.
