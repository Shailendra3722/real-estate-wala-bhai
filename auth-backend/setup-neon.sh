#!/bin/bash

echo "Setting up MongoDB for Real Estate App"
echo "======================================"
echo ""

echo "Step 1: Checking npm permissions..."
if [ ! -w ~/.npm ]; then
    echo "npm cache has permission issues"
    echo "Run: sudo chown -R $(id -u):$(id -g) ~/.npm"
    echo ""
fi

echo "Step 2: Installing dependencies..."
npm install

echo ""
echo "Step 3: Configure .env with:"
echo "MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/?appName=Cluster0"
echo "MONGODB_DB_NAME=real_estate_wala_bhai"
echo ""

echo "Step 4: Seed initial data:"
echo "node database/seed.js"
echo ""

echo "Step 5: Start the server:"
echo "node simple-api-server.js"
echo ""

echo "Setup instructions complete."
