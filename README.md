# PDF Merger SaaS

A modern, user-friendly PDF merging service built with Next.js, featuring a freemium model with daily usage limits.

## Features

### Free Plan
- **5 PDF merges per day** - Perfect for occasional users
- Daily limit resets at midnight
- Real-time usage tracking with progress bar
- Drag & drop file upload
- File reordering before merge

### Pro Plan ($9/month)
- Unlimited PDF merges
- No file size limits
- Priority support
- API access

## Technical Implementation

### Daily Limit System
- Tracks daily usage per user with automatic reset at midnight
- MongoDB storage for user data and usage statistics
- Real-time progress visualization