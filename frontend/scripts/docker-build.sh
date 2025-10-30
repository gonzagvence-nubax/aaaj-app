#!/bin/bash

# Build Docker image
docker build -t argentinos-scouting-chat .

# Run container
docker run -p 3000:3000 argentinos-scouting-chat
