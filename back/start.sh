#!/bin/sh

echo "🚀 Starting B2B Agent Backend..."

# Wait for dependencies if needed
if [ "$WAIT_FOR_DEPS" = "true" ]; then
    echo "⏳ Waiting for dependencies..."
    node wait-for-deps.js
fi

# Start the application
echo "🎯 Starting application on port ${PORT:-3335}..."
exec node app.js 