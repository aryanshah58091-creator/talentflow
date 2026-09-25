FROM python:3.14-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn==23.0.0
COPY . .
EXPOSE 8000
CMD ["sh","-c","python manage.py makemigrations accounts companies jobs applications && python manage.py migrate && python manage.py seed_demo && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]
