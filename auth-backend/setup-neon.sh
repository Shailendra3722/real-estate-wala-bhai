#!/bin/bash

echo "🚀 Setting up Neon PostgreSQL for Real Estate App"
echo "=================================================="
echo ""

# Step 1: Fix npm permissions (if needed)
echo "Step 1: Checking npm permissions..."
if [ ! -w ~/.npm ]; then
    echo "⚠️  npm cache has permission issues"
    echo "Run: sudo chown -R $(id -u):$(id -g) ~/.npm"
    echo ""
fi

# Step 2: Install dependencies
echo "Step 2: Installing dependencies..."
npm install pg dotenv

# Step 3: Run database schema
echo ""
echo "Step 3: Setting up database schema..."
echo "Run this command with your Neon connection string:"
echo "psql 'YOUR_NEON_CONNECTION_STRING' -f database/schema.sql"
echo ""
echo "OR use the Neon SQL Editor to run database/schema.sql"
echo ""

# Step 4: Seed data
echo "Step 4: After schema is created, seed initial data:"
echo "node database/seed.js"
echo ""

# Step 5: Start server
echo "Step 5: Start the server:"
echo "node simple-api-server.js"
echo ""

echo "✅ Setup instructions complete!"
echo "Follow the steps above to finish setup."
