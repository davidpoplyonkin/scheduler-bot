FROM python:3.13-slim

WORKDIR /usr/src/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD python -m alembic -c app/alembic.ini upgrade head && fastapi run app/main.py
