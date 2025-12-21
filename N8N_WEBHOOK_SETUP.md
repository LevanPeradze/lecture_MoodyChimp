# n8n Webhook Setup Guide: Achievement Reminder System

This guide explains how to set up an n8n workflow that will check user achievements and send reminder notifications every 5 minutes.

## Overview

The system will:
1. Call a webhook endpoint on your backend every 5 minutes
2. Check all users to see if they have all achievements unlocked
3. Send a notification to users who don't have all achievements (if 5+ minutes have passed since last reminder)
4. The notification message: "Unlock all achievements and get 30% off your next purchase!"

## Backend Implementation

### What Was Added

1. **New Database Column**: `last_achievement_reminder_sent` in the `users` table
   - Tracks when the last achievement reminder was sent to each user
   - Prevents spam by ensuring reminders are only sent every 5 minutes

2. **New Webhook Endpoint**: `POST /api/webhook/check-achievements`
   - Accepts webhook calls from n8n
   - Optional authentication via `X-Webhook-Secret` header or `secret` in body
   - Returns a summary of the check results

### Endpoint Details

**URL**: `POST /api/webhook/check-achievements`

**Headers** (Optional):
- `X-Webhook-Secret`: Secret key for authentication (if `WEBHOOK_SECRET` is set in `.env`)

**Body** (Optional):
```json
{
  "secret": "your-webhook-secret-here"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Achievement check completed",
  "results": {
    "totalUsers": 100,
    "checked": 100,
    "notificationsSent": 15,
    "usersWithAllAchievements": 5,
    "errors": []
  }
}
```

### Environment Variables

Add to your `.env` or `.env.local` file (optional but recommended):

```env
# Webhook secret for authentication (optional)
WEBHOOK_SECRET=your-secure-random-string-here

# System sender email for notifications (optional, defaults to system@moodychimp.com)
SYSTEM_SENDER_EMAIL=system@moodychimp.com
```

## n8n Workflow Setup

### Step 1: Create a New Workflow

1. Log into your n8n instance
2. Click "New Workflow"
3. Name it "Achievement Reminder Check"

### Step 2: Add Schedule Trigger

1. Click the "+" button to add a node
2. Search for "Schedule Trigger" or "Cron"
3. Configure it:
   - **Trigger Interval**: Every 5 minutes
   - **Cron Expression**: `*/5 * * * *` (runs every 5 minutes)

### Step 3: Add HTTP Request Node

1. Add a new node after the Schedule Trigger
2. Search for "HTTP Request" node
3. Configure it:
   - **Method**: POST
   - **URL**: `https://your-backend-url.com/api/webhook/check-achievements`
     - Replace `your-backend-url.com` with your actual backend URL
     - For local testing: `http://localhost:4000/api/webhook/check-achievements`
   - **Authentication**: None (or Basic Auth if you prefer)
   - **Headers** (if using webhook secret):
     ```
     X-Webhook-Secret: your-webhook-secret-here
     ```
   - **Body Content Type**: JSON (if sending secret in body)
   - **Body** (optional):
     ```json
     {
       "secret": "your-webhook-secret-here"
     }
     ```

### Step 4: Add Error Handling (Optional but Recommended)

1. Add an "IF" node after HTTP Request
2. Check if the response status is 200
3. If error, add a notification node (email, Slack, etc.) to alert you

### Step 5: Test the Workflow

1. Click "Execute Workflow" to test manually
2. Check the response in the HTTP Request node
3. Verify notifications are being sent to users in your database

### Step 6: Activate the Workflow

1. Toggle the "Active" switch in the top right
2. The workflow will now run automatically every 5 minutes

## Example n8n Workflow JSON

Here's a complete workflow JSON you can import into n8n:

```json
{
  "name": "Achievement Reminder Check",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 5
            }
          ]
        }
      },
      "id": "schedule-trigger",
      "name": "Every 5 Minutes",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://your-backend-url.com/api/webhook/check-achievements",
        "authentication": "none",
        "options": {}
      },
      "id": "http-request",
      "name": "Check Achievements",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [450, 300]
    }
  ],
  "connections": {
    "Every 5 Minutes": {
      "main": [
        [
          {
            "node": "Check Achievements",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Testing

### Test the Endpoint Directly

You can test the endpoint using curl:

```bash
# Without authentication
curl -X POST http://localhost:4000/api/webhook/check-achievements

# With authentication header
curl -X POST http://localhost:4000/api/webhook/check-achievements \
  -H "X-Webhook-Secret: your-secret-here"

# With authentication in body
curl -X POST http://localhost:4000/api/webhook/check-achievements \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-secret-here"}'
```

### Verify Notifications

1. Check the `notifications` table in your database
2. Look for notifications with title "Achievement Reminder"
3. Check the `users` table - `last_achievement_reminder_sent` should be updated

## Troubleshooting

### Notifications Not Being Sent

1. **Check if users have all achievements**: The endpoint skips users who already have all achievements
2. **Check time interval**: Reminders are only sent if 5+ minutes have passed since the last one
3. **Check database**: Verify the `notifications` table exists and is accessible
4. **Check logs**: Look at your backend server logs for errors

### Webhook Authentication Failing

1. Make sure `WEBHOOK_SECRET` is set in your `.env` file
2. Ensure the secret in n8n matches the one in your `.env`
3. Check that the header name is exactly `X-Webhook-Secret` (case-sensitive)

### n8n Workflow Not Running

1. Make sure the workflow is **Active** (toggle in top right)
2. Check the Schedule Trigger configuration
3. Verify your n8n instance is running and accessible
4. Check n8n execution logs for errors

## Security Considerations

1. **Use HTTPS**: Always use HTTPS in production for the webhook endpoint
2. **Webhook Secret**: Set a strong, random secret and keep it secure
3. **Rate Limiting**: Consider adding rate limiting to the endpoint if needed
4. **IP Whitelisting**: Optionally restrict the endpoint to n8n's IP addresses

## Customization

### Change Reminder Message

Edit the `REMINDER_MESSAGE` constant in `backend/src/server.js`:
```javascript
const REMINDER_MESSAGE = 'Your custom message here!';
```

### Change Reminder Interval

Edit the `REMINDER_INTERVAL_MINUTES` constant in `backend/src/server.js`:
```javascript
const REMINDER_INTERVAL_MINUTES = 10; // Change to 10 minutes
```

And update the n8n Schedule Trigger accordingly.

### Change Notification Title

Edit the `REMINDER_TITLE` constant in `backend/src/server.js`:
```javascript
const REMINDER_TITLE = 'Your Custom Title';
```

## Next Steps

1. Set up your n8n instance (if not already done)
2. Create the workflow as described above
3. Test the endpoint manually
4. Activate the workflow
5. Monitor the results and adjust as needed

## Support

If you encounter issues:
1. Check backend server logs
2. Check n8n execution logs
3. Verify database connectivity
4. Test the endpoint directly with curl/Postman

