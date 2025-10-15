import os

from dotenv import load_dotenv
from app.common.logger import Logger

logger = Logger()

load_dotenv(".env")
load_dotenv("/secrets/.env")

config = {}
if os.getenv("ENV", None) == "dev":
    config["ENV"] = os.getenv("ENV")
    config["FRONT_URL"] = os.getenv("FRONT_URL")
    config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    config["OPENAI_API_ORG"] = os.getenv("OPENAI_API_ORG")
    config["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

else:
    config["ENV"] = os.getenv("ENV")
    config["FRONT_URL"] = os.getenv("FRONT_URL")
    config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    config["OPENAI_API_ORG"] = os.getenv("OPENAI_API_ORG")
    config["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
