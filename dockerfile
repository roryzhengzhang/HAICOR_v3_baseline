FROM python:3.8-buster

ENV FLASK_APP="website:app"
ENV DATA_DIRECTORY="/website/data"

#zheng_website will expose as 80 port in docker host
EXPOSE 5000
VOLUME ${DATA_DIRECTORY}

#specify the workdir
WORKDIR /website

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD [ "flask", "run", "--host", "0.0.0.0" ]
