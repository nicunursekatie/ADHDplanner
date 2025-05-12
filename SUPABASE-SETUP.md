# Supabase Integration Setup Guide

This document explains how to set up Supabase for cloud storage in the ADHDplanner app.

## Prerequisites

1. A Supabase account (create one at [supabase.com](https://supabase.com))
2. A Supabase project (create a new project in your Supabase dashboard)

## Step 1: Create Database Tables

The app needs several tables in your Supabase database. You can create these using the SQL Editor in the Supabase dashboard.

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Execute the SQL commands from the `supabase-schema.sql` file in this repository

## Step 2: Set Up Row-Level Security (Optional)

If you want to implement authentication for your app (so multiple users can use it with their own data):

1. Uncomment the RLS (Row-Level Security) policies in the SQL file
2. Create authentication in the app using Supabase Auth
3. Add user_id columns to all tables

## Step 3: Use the App with Supabase Storage

1. Open the ADHDplanner app
2. Go to Settings
3. In the "Storage Management" section, select "Cloud Storage (Supabase)"
4. The app will automatically connect to Supabase using the credentials provided in the code
5. If you have existing data, use the "Sync to Cloud" button to move your data to Supabase

## Switching Between Storage Types

- You can switch between local browser storage and Supabase cloud storage at any time
- Use the "Sync to Cloud" button to upload your local data to Supabase
- Use the "Sync from Cloud" button to download your Supabase data to local storage

## Notes on Data Storage

- When using Supabase storage, your data is stored in the cloud and can be accessed from multiple devices
- The app still maintains a local copy of your data for offline use
- Changes are synchronized automatically when you're online

## Troubleshooting

If you encounter issues with Supabase integration:

1. **Connection Issues**: Check if you can access the Supabase dashboard and if your project is active
2. **Table Creation Errors**: Ensure you've run the SQL commands correctly
3. **Data Not Synchronizing**: Use the manual sync buttons in the Settings page
4. **Authentication Problems**: If you've enabled authentication, make sure you're signed in

You can always switch back to local storage if you encounter persistent issues with cloud storage.