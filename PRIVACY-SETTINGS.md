# Privacy & Notification Settings Feature

## Overview

This feature allows users to control their profile visibility, bio display, theme preferences, and email notification settings.

## Database Changes

### New Fields Added to User Table

- `profileVisibility` - ENUM('public', 'private') - Control who can see the profile
- `showBioPublic` - BOOLEAN - Show/hide bio on public profile
- `theme` - VARCHAR(20) - Theme preference (light, dark, system)
- `emailNotifications` - BOOLEAN - Enable/disable email notifications
- `weeklyDigest` - BOOLEAN - Enable/disable weekly digest emails
- `marketingEmails` - BOOLEAN - Enable/disable marketing emails

### Migration File

Location: `deploy/migrations/add-privacy-notification-settings.sql`

### Running the Migration

#### On NFSN (Production):

```bash
# Option 1: Use PowerShell script
.\deploy\run-settings-migration.ps1

# Option 2: Manual via SSH
ssh jvc@ssh.phx.nearlyfreespeech.net
cd /home/protected
mysql -h devlogs.db -u jvc -p devlogs < /path/to/add-privacy-notification-settings.sql
```

#### On Local Development:

```bash
mysql -u your_user -p your_database < deploy/migrations/add-privacy-notification-settings.sql
```

## Backend API Endpoints

### GET /api/users/:id/settings

Retrieve user privacy and notification settings.

**Authentication:** Required (Bearer token)  
**Authorization:** User must own the profile  
**Rate Limit:** 20 requests per 15 minutes

**Response:**

```json
{
  "success": true,
  "settings": {
    "profileVisibility": "public",
    "showBioPublic": true,
    "theme": "light",
    "emailNotifications": true,
    "weeklyDigest": true,
    "marketingEmails": false
  }
}
```

### PUT /api/users/:id/settings

Update user privacy and notification settings.

**Authentication:** Required (Bearer token)  
**Authorization:** User must own the profile  
**Rate Limit:** 20 requests per 15 minutes

**Request Body:**

```json
{
  "profileVisibility": "private",
  "showBioPublic": false,
  "theme": "dark",
  "emailNotifications": true,
  "weeklyDigest": false,
  "marketingEmails": false
}
```

**Validation:**

- `profileVisibility`: Must be 'public' or 'private'
- `theme`: Must be 'light', 'dark', or 'system'
- Boolean fields must be actual boolean values
- All fields are optional (partial updates supported)

**Response:**

```json
{
  "success": true,
  "settings": {
    "profileVisibility": "private",
    "showBioPublic": false,
    "theme": "dark",
    "emailNotifications": true,
    "weeklyDigest": false,
    "marketingEmails": false
  },
  "message": "Settings updated successfully"
}
```

## Frontend Implementation

### Location

Component: `src/components/Profile.tsx`  
Styles: `src/components/Profile.css`

### UI Features

#### Privacy Settings Section

1. **Profile Visibility** - Dropdown (Public/Private)

   - Badge shows current visibility status
   - Controls whether profile is publicly accessible

2. **Show Bio Publicly** - Toggle switch

   - Controls bio visibility on public profiles
   - Independent of profile visibility setting

3. **Theme Preference** - Dropdown (Light/Dark/System)
   - User's preferred color theme
   - Stored in database for cross-device sync

#### Notification Settings Section

1. **Email Notifications** - Toggle switch

   - Master switch for all email notifications
   - Disabling this disables all notification types

2. **Weekly Digest** - Toggle switch

   - Weekly summary of account activity
   - Disabled when Email Notifications is off

3. **Marketing Emails** - Toggle switch
   - Updates about new features and tips
   - Disabled when Email Notifications is off

### State Management

- Settings fetched on component mount via `useEffect`
- Separate from profile update form
- Auto-dismiss success message after 3 seconds
- Independent "Save Settings" button

## Testing Checklist

### 1. Database Migration

- [ ] Run migration successfully
- [ ] Verify all fields exist: `DESCRIBE User;`
- [ ] Check default values are set correctly
- [ ] Verify index was created on profileVisibility

### 2. Backend API Testing

#### GET /api/users/:id/settings

- [ ] Returns 401 without authentication
- [ ] Returns 403 for unauthorized user
- [ ] Returns 404 for non-existent user
- [ ] Returns correct default settings for new users
- [ ] Returns updated settings after changes

#### PUT /api/users/:id/settings

- [ ] Returns 401 without authentication
- [ ] Returns 403 for unauthorized user
- [ ] Returns 400 for invalid profileVisibility value
- [ ] Returns 400 for invalid theme value
- [ ] Returns 400 for non-boolean values in boolean fields
- [ ] Successfully updates individual settings
- [ ] Successfully updates multiple settings at once
- [ ] Supports partial updates (only changed fields)
- [ ] Rate limiting works (20 requests / 15 min)

### 3. Frontend UI Testing

#### Settings Display

- [ ] Settings section appears in Profile edit mode
- [ ] All toggle switches display correctly
- [ ] Dropdowns show current values
- [ ] Badge displays correct visibility status
- [ ] Loading states work properly

#### Settings Updates

- [ ] Profile visibility changes save correctly
- [ ] Bio visibility toggle works
- [ ] Theme preference changes save
- [ ] Email notification toggle works
- [ ] Weekly digest toggle disabled when email off
- [ ] Marketing emails toggle disabled when email off
- [ ] Success message appears after save
- [ ] Success message auto-dismisses after 3 seconds
- [ ] Error messages display properly
- [ ] Save button shows loading state

#### Data Persistence

- [ ] Settings persist after page reload
- [ ] Settings sync across browser sessions
- [ ] Settings remain after logout/login

### 4. Integration Testing

- [ ] Settings don't affect profile info updates
- [ ] Profile updates don't reset settings
- [ ] Theme preference can be applied (future implementation)
- [ ] Email preferences respected in email system (future)

### 5. Security Testing

- [ ] Cannot access other users' settings
- [ ] Cannot update other users' settings
- [ ] Rate limiting prevents abuse
- [ ] SQL injection attempts blocked
- [ ] XSS attempts in settings values blocked

### 6. Edge Cases

- [ ] Empty database fields handle correctly
- [ ] NULL values convert to defaults
- [ ] Rapid toggle changes handled properly
- [ ] Network errors handled gracefully
- [ ] Concurrent updates handled correctly

## Deployment Steps

1. **Database Migration**

   ```bash
   .\deploy\run-settings-migration.ps1
   ```

2. **Deploy Backend**

   ```bash
   .\deploy-backend.ps1
   ```

3. **Deploy Frontend**

   ```bash
   npm run build
   git add dist/
   git commit -m "feat: Add privacy and notification settings"
   git push
   ```

4. **Verify Deployment**
   - Test GET /api/users/:id/settings endpoint
   - Test PUT /api/users/:id/settings endpoint
   - Test frontend settings UI
   - Verify settings persist across sessions

## Future Enhancements

### Theme Application

Currently, the theme preference is stored but not applied. Future work:

- Add theme context provider
- Apply theme to entire app
- Support system theme detection
- Add theme transition animations

### Email Notifications

Email preferences are stored but not yet enforced. Future work:

- Implement email notification system
- Check preferences before sending emails
- Add unsubscribe links to all emails
- Create weekly digest email template

### Profile Visibility Enforcement

Future work to actually enforce privacy settings:

- Hide private profiles from public user list
- Restrict API access to private profiles
- Add privacy indicators on profile pages
- Implement friend/follow system for private profiles

## Troubleshooting

### Settings Not Saving

1. Check browser console for errors
2. Verify authentication token is valid
3. Check network tab for API response
4. Verify database migration ran successfully

### Settings Not Loading

1. Check if migration added all fields
2. Verify API endpoint is accessible
3. Check for JavaScript errors in console
4. Verify user ID matches authenticated user

### Rate Limiting Errors

- Wait 15 minutes before retrying
- Reduce frequency of settings updates
- Check if rate limit is too restrictive

## Files Modified

### Backend

- `deploy/index.js` - Added GET and PUT endpoints, rate limiter
- `deploy/migrations/add-privacy-notification-settings.sql` - Database migration
- `deploy/run-settings-migration.ps1` - Migration helper script

### Frontend

- `src/components/Profile.tsx` - Added settings UI and logic
- `src/components/Profile.css` - Added toggle switch and settings styles

### Documentation

- `PRIVACY-SETTINGS.md` - This file
- `file-updated.txt` - Updated tracking document

## Support

For issues or questions, check:

1. Browser console for errors
2. Network tab for API responses
3. Server logs for backend errors
4. This documentation for common solutions
