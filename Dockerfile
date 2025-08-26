FROM alpine:3.15.11

WORKDIR /application

RUN apk update && apk add --no-cache python3 py3-pip sqlite bash
RUN python3 -m venv venv

COPY . .
RUN ./venv/bin/python -m pip install --no-cache-dir -r requirements.txt
RUN sqlite3 database.db < schema.sql

EXPOSE 5000

CMD [ "bash", "-c", "./venv/bin/gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 run:app" ]