from mangum import Mangum
from api.main import create_app

app = create_app()
handler = Mangum(app)
