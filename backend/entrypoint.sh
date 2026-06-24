#!/bin/sh
set -e

if [ ! -d "migrations" ]; then
    echo "Initializing migrations folder..."
    flask db init || echo "Migrations already initialized."
fi

echo "Running database migrations..."
flask db upgrade || echo "No migrations to apply or pending."

exec "$@"