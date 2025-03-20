import os

from fastapi import FastAPI

is_lambda = os.environ.get("AWS_LAMBDA_FUNCTION_NAME") is not None


def create_app():
    app = FastAPI(title="Property Management Test")

    @app.get("/api/status")
    async def status():
        return {"status": "ok", "environment": "lambda" if is_lambda else "local"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000)
