FROM alpine:3.21.3

WORKDIR /application

RUN apk update && apk add --no-cache python3 py3-pip sqlite
RUN python3 -m venv venv

COPY . .
RUN ./venv/bin/python -m pip install --no-cache-dir -r requirements.txt
RUN sqlite3 database.db < schema.sql

EXPOSE 5000

CMD [ "./venv/bin/python", "run.py" ]