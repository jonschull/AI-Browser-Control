#!/bin/bash

# This script handles starting the server cleanly.
# It finds and kills any process using the required ports before starting.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Attempting to stop any running server processes..."
# Use pkill to be more thorough in finding and stopping old server instances.
if pkill -f "python server.py"; then
    echo "Stopped existing server process(es)."
    # Add a small delay to allow ports to be released
    sleep 1
else
    echo "No existing server process found."
fi

echo "Starting server in the background..."
nohup python server.py > server.log 2>&1 &
