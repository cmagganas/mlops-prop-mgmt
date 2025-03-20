# Deployment Guide for Property Management API

This document provides step-by-step instructions for deploying the Property Management API to AWS Lambda with API Gateway and authentication using Amazon Cognito.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Python 3.8+ installed locally
- Node.js and npm (for frontend deployment, if applicable)

## Step 1: Package the Lambda Function

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the packaging script:
   ```bash
   ./package-lambda.sh
   ```

3. This script will:
   - Clean up any previous packaging artifacts
   - Install required dependencies
   - Copy application files
   - Create a `lambda_pkg.zip` file for deployment

## Step 2: Create AWS Cognito Resources

### Create a User Pool

1. Open the AWS Console and navigate to Cognito
2. Create a new User Pool:
   - Configure sign-in options (email, username, etc.)
   - Set password policies
   - Configure MFA if needed
   - Set up app clients

### Create an App Client

1. Within your User Pool, create an App Client:
   - Disable client secret (for public clients) or generate one
   - Configure callback URLs (e.g., `https://your-api-gateway-url/prod/auth/callback`)
   - Configure sign-out URLs (e.g., `https://your-api-gateway-url/prod`)
   - Select OAuth flows (Authorization code grant)
   - Select OAuth scopes (email, openid, profile)

### Configure Domain

1. Set up a domain for your Cognito User Pool:
   - Use either an Amazon Cognito domain or your custom domain
   - Note this domain for your environment variables

## Step 3: Deploy the Lambda Function

1. Create a new Lambda function:
   ```bash
   aws lambda create-function \
     --function-name property-management-api \
     --runtime python3.9 \
     --role arn:aws:iam::<account-id>:role/<lambda-execution-role> \
     --handler aws_lambda_handler.handler \
     --zip-file fileb://lambda_pkg.zip \
     --timeout 30 \
     --memory-size 512
   ```

2. Update Lambda environment variables:
   ```bash
   aws lambda update-function-configuration \
     --function-name property-management-api \
     --environment "Variables={REACT_APP_COGNITO_USER_POOL_ID=us-west-2_xxxxxxxx,REACT_APP_COGNITO_CLIENT_ID=xxxxxxxxxx,...}"
   ```

## Step 4: Create API Gateway

1. Create a new REST API:
   ```bash
   aws apigateway create-rest-api \
     --name property-management-api \
     --endpoint-configuration types=REGIONAL
   ```

2. Get the API ID and create a proxy resource:
   ```bash
   API_ID=<your-api-id>
   PARENT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[0].id' --output text)
   
   aws apigateway create-resource \
     --rest-api-id $API_ID \
     --parent-id $PARENT_ID \
     --path-part "{proxy+}"
   ```

3. Set up the ANY method and integrate with Lambda:
   ```bash
   RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`/{proxy+}`].id' --output text)
   
   aws apigateway put-method \
     --rest-api-id $API_ID \
     --resource-id $RESOURCE_ID \
     --http-method ANY \
     --authorization-type NONE
   
   aws apigateway put-integration \
     --rest-api-id $API_ID \
     --resource-id $RESOURCE_ID \
     --http-method ANY \
     --type AWS_PROXY \
     --integration-http-method POST \
     --uri arn:aws:apigateway:<region>:lambda:path/2015-03-31/functions/arn:aws:lambda:<region>:<account-id>:function:property-management-api/invocations
   ```

4. Deploy the API to a stage:
   ```bash
   aws apigateway create-deployment \
     --rest-api-id $API_ID \
     --stage-name prod
   ```

5. Grant API Gateway permission to invoke Lambda:
   ```bash
   aws lambda add-permission \
     --function-name property-management-api \
     --statement-id apigateway-prod \
     --action lambda:InvokeFunction \
     --principal apigateway.amazonaws.com \
     --source-arn "arn:aws:execute-api:<region>:<account-id>:$API_ID/prod/*/*"
   ```

## Step 5: Update Environment Variables

1. Create a `.env` file based on the provided `.env.example` file
2. Update the values with your Cognito and API Gateway details
3. Apply these environment variables to your Lambda function using the AWS console or CLI

## Step 6: Test the Deployment

1. Access your API endpoint: `https://<api-id>.execute-api.<region>.amazonaws.com/prod/`
2. Test authentication by visiting: `/auth/test`
3. Test the login flow by visiting: `/auth/login`

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure your API Gateway has CORS enabled if accessing from a different domain
2. **Authentication Errors**: Verify Cognito settings and callback URLs
3. **Lambda Timeout**: Increase the timeout if your application needs more processing time
4. **Missing Environment Variables**: Check that all required environment variables are set
5. **Package Size Limits**: If your deployment package exceeds Lambda limits, consider using Lambda Layers

### Viewing Logs:

```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/property-management-api \
  --start-time $(date -v-1d +%s000) \
  --query 'events[*].message'
```

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/) 