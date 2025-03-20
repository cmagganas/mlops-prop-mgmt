### Next steps

1. ✅ Create an `aws_lambda_handler.py` file that looks like this

```python
from api.main import create_app
from mangum import Mangum

app = create_app()
handler = Mangum(app)
```

2. ✅ Package your code (including the handler) into a lambda function. (layers, etc.) -- you'll have to install the dependencies, e.g. `pip install ...` pip install all the requirements
   - ✅ Created packaging scripts: `package-lambda.sh` and `package-lambda-docker.sh`
   - ✅ Created `requirements.txt` for Lambda dependencies
   - [ ] Create Lambda deployment packages:
     - `lambda.zip` - Contains application code (~460KB)
     - `lambda-layer.zip` - Contains dependencies
   - Note: If the frontend needs to be bundled, use `bash run.sh build` and copy the built assets to `src/api/static/`

3. [ ] Deploy the lambda function
   - [ ] Create a new Lambda function in AWS console or using AWS CLI
   - [ ] Upload the `lambda.zip` package to the Lambda function
   - [ ] Create a Lambda layer from `lambda-layer.zip` and attach it to the function
   - [ ] Configure the handler as `aws_lambda_handler.handler`

4. [ ] Set all env vars needed by the lambda function (everthing in your .env file)
   - [ ] Copy environment variables from `.env` to Lambda environment variables

5. [ ] Create an API GW and set it up to proxy all requests to the lambda function. No need to configure any auth on this since the fastapi handler does all that with your /auth endpoints.
   - [ ] Create a new REST API in API Gateway
   - [ ] Configure a proxy resource for all routes (`/{proxy+}`)
   - [ ] Connect it to the Lambda function
   - [ ] Deploy the API to a stage (e.g., `prod`)

6. [ ] Take the URL of the API GW and put it in 2 places
   - [ ] Add it as callback URL to cognito
   - [ ] Set it as an env var to the lambda function (along with all the other env vars in the .env file) 