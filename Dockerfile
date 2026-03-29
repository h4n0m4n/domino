FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml README.md LICENSE ./
COPY cascade/ cascade/
COPY scenarios/ scenarios/

RUN pip install --no-cache-dir -e .

EXPOSE 8000

CMD ["uvicorn", "cascade.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
