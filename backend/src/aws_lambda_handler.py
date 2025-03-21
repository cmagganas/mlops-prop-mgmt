from api.main import create_app
from mangum import Mangum

APP = create_app()
handler = Mangum(APP)