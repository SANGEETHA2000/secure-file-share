# Use an official Python runtime as the base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create an entrypoint script that handles migrations and starts the server
RUN echo '#!/bin/sh\n\
python manage.py migrate --no-input\n\
gunicorn core.wsgi:application --bind 0.0.0.0:$PORT\n'\
> /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Use the entrypoint script as the container's command
CMD ["/app/entrypoint.sh"]