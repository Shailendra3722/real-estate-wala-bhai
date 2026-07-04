/**
 * Vercel Serverless Entry Point
 * 
 * Imports the Express application from the backend directory and exports it
 * for Vercel's serverless runtime.
 */

const app = require('../backend/server');

module.exports = app;
