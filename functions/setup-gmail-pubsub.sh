#!/bin/bash
# Gmail Pub/Sub Setup Script for Padoca Pizza
# This script configures Gmail push notifications for real-time email processing

set -e

PROJECT_ID="padoca-96688"
TOPIC_NAME="gmail-notifications"
FULL_TOPIC="projects/${PROJECT_ID}/topics/${TOPIC_NAME}"
GMAIL_PUSH_SA="gmail-api-push@system.gserviceaccount.com"

echo "🚀 Gmail Pub/Sub Setup - Padoca Pizza"
echo "========================================"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1; then
    echo "❌ gcloud not authenticated. Run: gcloud auth login"
    exit 1
fi

echo "📌 Step 1: Enable required APIs"
gcloud services enable pubsub.googleapis.com --project=$PROJECT_ID
gcloud services enable gmail.googleapis.com --project=$PROJECT_ID
echo "✅ APIs enabled"
echo ""

echo "📌 Step 2: Create Pub/Sub topic"
if gcloud pubsub topics describe $TOPIC_NAME --project=$PROJECT_ID > /dev/null 2>&1; then
    echo "⚠️ Topic already exists"
else
    gcloud pubsub topics create $TOPIC_NAME --project=$PROJECT_ID
    echo "✅ Topic created: $FULL_TOPIC"
fi
echo ""

echo "📌 Step 3: Grant Gmail permission to publish to topic"
gcloud pubsub topics add-iam-policy-binding $TOPIC_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:$GMAIL_PUSH_SA" \
    --role="roles/pubsub.publisher"
echo "✅ Permission granted to Gmail service account"
echo ""

echo "📌 Step 4: Deploy Cloud Functions"
cd "$(dirname "$0")"
npm install
firebase deploy --only functions
echo "✅ Cloud Functions deployed"
echo ""

echo "📌 Step 5: Activate Gmail Watch"
SETUP_URL="https://us-central1-${PROJECT_ID}.cloudfunctions.net/setupGmailWatch"
echo "Calling: $SETUP_URL"
curl -s "$SETUP_URL" | jq .
echo ""

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Make sure OAuth tokens are stored in Firestore (gmailTokens/padocainc)"
echo "2. Send a test email to padocainc@gmail.com"
echo "3. Check Firebase Functions logs: firebase functions:log"
echo ""
echo "Tokens required in Firestore (gmailTokens/padocainc):"
echo "  - clientId: Your OAuth Client ID"
echo "  - clientSecret: Your OAuth Client Secret"
echo "  - refreshToken: OAuth Refresh Token from Gmail authorization"
echo ""
