#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | xargs)
    echo "Environment variables loaded from .env file"
else
    echo "Warning: .env file not found. Please create one with AUTH0_AUDIENCE, AUTH0_DOMAIN, AUTH0_CLIENT_ID"
fi

# Start the Angular development server
ng serve --project=planza
