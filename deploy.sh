#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Nutri-Guardian Pro — Full Deploy Script
# Deploys Firebase Functions + Frontend to Firebase Hosting
# Usage: chmod +x deploy.sh && ./deploy.sh
# ─────────────────────────────────────────────────────────

set -e

echo ""
echo "🛡️  Nutri-Guardian Pro — Hackathon Deploy"
echo "─────────────────────────────────────────"
echo ""

# ── Step 1: Check Firebase CLI ────────────────────────────
if ! command -v firebase &> /dev/null; then
  echo "📦 Installing Firebase CLI..."
  npm install -g firebase-tools
fi

# ── Step 2: Get the Firebase project ID ──────────────────
echo "📋 Your Firebase projects:"
firebase projects:list
echo ""
echo "⚠️  Enter your Firebase Project ID (e.g. nutri-guardian-pro):"
read PROJECT_ID
firebase use $PROJECT_ID

# ── Step 3: Deploy Cloud Functions (backend) ─────────────
echo ""
echo "🔧 Deploying Cloud Functions..."
cd functions
npm install
cd ..
firebase deploy --only functions --project $PROJECT_ID

# ── Step 4: Get the deployed Functions region/URL ────────
# Standard Firebase Functions URL format:
REGION="us-central1"
FUNCTIONS_BASE_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net"
echo ""
echo "✅ Functions deployed at: $FUNCTIONS_BASE_URL"

# ── Step 5: Build frontend with real backend URL ──────────
echo ""
echo "🏗️  Building frontend with production backend URL..."
VITE_BACKEND_URL=$FUNCTIONS_BASE_URL npm run build

# ── Step 6: Deploy frontend to Firebase Hosting ──────────
echo ""
echo "🚀 Deploying frontend to Firebase Hosting..."
firebase deploy --only hosting --project $PROJECT_ID

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅  DEPLOY COMPLETE!"
echo "🌐  Live URL: https://${PROJECT_ID}.web.app"
echo "📌  Also available at: https://${PROJECT_ID}.firebaseapp.com"
echo "═══════════════════════════════════════════════════"
echo ""
