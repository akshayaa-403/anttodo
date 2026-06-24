FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2 (PostgreSQL) and others
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifest first (leverages Docker caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entrypoint and make it executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy the rest of the application code
COPY . .

# Set Python path to find the 'src' module
ENV PYTHONPATH=/app

# Entrypoint runs Alembic migrations before starting the server
ENTRYPOINT ["/entrypoint.sh"]

# Default command (overridden in docker-compose for development)
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]