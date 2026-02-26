#!/bin/bash

# Real Estate Backend Setup Script
# This script sets up the database and seeds initial data

set -e  # Exit on error

echo "🏗️  Real Estate Backend Setup"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your database credentials."
    echo ""
    read -p "Press Enter after editing .env to continue..."
fi

# Source environment variables
source .env

echo "📋 Configuration:"
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "   Please install PostgreSQL first: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Check if database exists
echo "🔍 Checking if database exists..."
if psql -U "$DB_USER" -h "$DB_HOST" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "📦 Creating database '$DB_NAME'..."
    createdb -U "$DB_USER" -h "$DB_HOST" "$DB_NAME"
    echo "✅ Database created"
fi

echo ""

# Run schema
echo "📐 Setting up database schema..."
if [ -f database_schema.sql ]; then
    psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -f database_schema.sql
    echo "✅ Schema created"
else
    echo "❌ database_schema.sql not found"
    exit 1
fi

echo ""

# Install npm dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing npm dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Node modules already installed"
fi

echo ""

# Seed database
echo "🌱 Seeding database with sample data..."
if [ -f seed-database.js ]; then
    node seed-database.js
    echo "✅ Database seeded"
else
    echo "❌ seed-database.js not found"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start the backend server:"
echo "     npm run dev"
echo ""
echo "  2. Test the API:"
echo "     curl http://localhost:3000/api/properties"
echo ""
echo "  3. Open the frontend:"
echo "     python3 -m http.server 8080"
echo "     Then visit http://localhost:8080/map-explore.html"
echo ""
