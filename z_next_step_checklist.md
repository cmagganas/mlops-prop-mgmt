### Next steps

1. Create an `index.py` or `aws_lambda_handler.py` file that looks like this

```python
from api.main import create_app
from mangum import Mangum

app = create_app()
handler = Mangum(app)
```

2. Package your code (including the handler) into a lambda function. (layers, etc.) -- you'll have to install the dependencies, e.g. `pip install ...` pip install all the requirements

* Note: remember to include the bundled frontend files in the package (just use the `npm run build` command in the `bash run.sh build` command)

3. Deploy the lambda function

4. Set all env vars needed by the lambda function (everthing in your .env file)

5. Create an API GW and set it up to proxy all requests to the lambda function. No need to configure any auth on this since the fastapi handler does all that with your /auth endpoints.

6. Take the URL of the API GW and put it in 2 places

  1. add it as callback URL to cognito

  2. as an env var to the lambda function (along with all the other env vars in the .env file)
