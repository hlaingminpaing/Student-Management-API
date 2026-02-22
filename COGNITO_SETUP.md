# AWS Cognito Setup Guide for Student Management API

This guide walks you through setting up AWS Cognito for authentication and authorization in your Student Management frontend.

## Prerequisites
- AWS Account with appropriate permissions
- Access to AWS Console

---

## Step-by-Step Setup

### **Step 1: Create a Cognito User Pool**

1. **Go to AWS Console**
   - Navigate to: https://console.aws.amazon.com/
   - Search for "Cognito" in the search bar
   - Click on "Cognito"

2. **Create User Pool**
   - Click on "Create user pool" (or "User pools" → "Create user pool")
   - Choose **"Cognito user pool"** option
   - Click "Next step"

3. **Configure Sign-up Experience**
   - Select: "Email and username" (for sign-in options)
   - Under "Authentication methods", uncheck "Allow sign in with preferred username"
   - Click "Next"

4. **Configure Password Policy**
   - Minimum length: 8 characters
   - Check: "Require uppercase letters"
   - Check: "Require numbers"
   - Check: "Require special characters" (optional but recommended)
   - Click "Next"

5. **Configure Multi-Factor Authentication (MFA)**
   - MFA enforcement: "Optional" (for easier testing)
   - Uncheck "Time-based one-time password (TOTP)"
   - Check "SMS message" if you want SMS codes
   - Click "Next"

6. **Configure Account Recovery**
   - Check: "Email only"
   - Click "Next"

7. **Set up Email Notification**
   - Select: "Send email with Cognito" (default)
   - Click "Next"

8. **User Pool Name**
   - Enter: `StudentManagementPool` (or your preferred name)
   - Click "Next"

9. **Review and Confirm**
   - Review all settings
   - Click "Create user pool"
   - Wait for creation to complete

---

### **Step 2: Create an App Client**

1. **In the User Pool**
   - Select your newly created user pool
   - In the left sidebar, go to **"App integration"** → **"App clients and analytics"**
   - Click "Create app client"

2. **Configure App Client**
   - **App client name**: `StudentManagementClient`
   
   - **Authentication flows**:
     - Check: "ALLOW_USER_PASSWORD_AUTH" (for login)
     - Check: "ALLOW_REFRESH_TOKEN_AUTH" (for token refresh)
     - Uncheck other flows for security
   
   - **Allowed Callback URLs** (after deployment):
     - Add: `http://localhost:8000` (for local testing)
     - Add: `https://yourdomain.com` (for production)
   
   - **Allowed Sign-out URLs**:
     - Add: `http://localhost:8000`
     - Add: `https://yourdomain.com`
   
   - **Allowed OAuth Scopes**: 
     - Check: "email"
     - Check: "openid"
     - Check: "profile"
   
   - Click "Create app client"

3. **Save Credentials**
   - Note down the **"App client ID"** (you'll need this)
   - Back in "App clients and analytics" screen, click on your app
   - Copy and save the **Client ID**

---

### **Step 3: Get Your User Pool ID and Region**

1. **Find User Pool ID**
   - From your User Pool page, look at the top
   - You'll see something like: `ap-southeast-1_xxxxxxxxx`
   - This is your **User Pool ID**

2. **Remember Your Region**
   - The region is the first part: `ap-southeast-1` (or your region)

---

### **Step 4: Enable Password-Based Authentication Flow**

1. **Go to App Client Settings**
   - User Pool → "App integration" → "App clients and analytics"
   - Click on your app client

2. **Enable Password Authentication**
   - In the app client settings, scroll to "Authentication flows"
   - Make sure **"ALLOW_USER_PASSWORD_AUTH"** is checked
   - Click "Save app client"

3. **Configure User Pool Policies**
   - Go to User Pool → "Policies"
   - Ensure password requirement policies are set

---

### **Step 5: Configure Email Sending (for sign-up verification)**

1. **Move Out of Sandbox (Optional but Recommended)**
   - User Pool → "Messaging and campaigns" → "Email"
   - If you see "Sandbox mode", click "Request production access"
   - Fill out the form and submit
   - AWS will review (usually takes a few hours)

2. **Set Default Email Address** (while in sandbox)
   - Go to "Messaging and campaigns" → "Email"
   - Verify at least one email address in your account for testing

---

### **Step 6: Update Your Frontend Code**

1. **Open your `frontend/script.js`**

2. **Update the COGNITO_CONFIG object at the top:**
   ```javascript
   const COGNITO_CONFIG = {
       region: 'ap-southeast-1',           // Your region
       userPoolId: 'ap-southeast-1_abc123xyz',  // Your User Pool ID
       clientId: 'your_client_id_here',         // Your App Client ID
   };
   ```

3. **Where to find these values:**
   - **region**: From your user pool ID (first part before underscore)
   - **userPoolId**: User Pool → "General settings" (scroll down) → Pool ID
   - **clientId**: "App integration" → "App clients and analytics" → Click your app → "Client ID"

---

### **Step 7: Test Your Implementation**

1. **Start your frontend server**
   - Navigate to your project directory
   - Run: `python -m http.server 8000` (or your preferred server)
   - Open: `http://localhost:8000`

2. **First, create a test user in AWS Console** (optional)
   - User Pool → "Users"
   - Click "Create user"
   - Enter email and temporary password
   - User will be prompted to change password on first login

3. **Test Sign Up**
   - Click "Sign Up" tab
   - Fill in the form with:
     - Name: Your name
     - Email: A valid email
     - Password: At least 8 chars, 1 uppercase, 1 number
   - Click "Sign Up"
   - Check your email for verification code

4. **Test Login**
   - Switch to "Login" tab
   - Enter your email and password
   - You should see the student management form

---

## Enable Cognito to Allow Password Authentication Flow

**IMPORTANT**: By default, Cognito doesn't allow `USER_PASSWORD_AUTH`. You must enable it:

1. Go to **User Pool → "App clients and analytics"**
2. Click on your app client
3. Under **"Authentication flows"** section:
   - Check: **"ALLOW_USER_PASSWORD_AUTH"**
   - Check: **"ALLOW_REFRESH_TOKEN_AUTH"**
4. Scroll down and check **"Enable token based authentication (recommended)"**
5. Click **"Save app client"**

---

## Frontend Flow Diagram

```
User Opens App
    ↓
Check localStorage for idToken
    ↓
Token exists? → YES → Load Student Management UI
    ↓ NO
Show Authentication Modal (Login/Signup)
    ↓
User enters credentials or signs up
    ↓
AWS Cognito validates
    ↓
Success → Store idToken + email in localStorage
    ↓
Load Student Management UI with Authorization Header
    ↓
All API calls include Authorization: Bearer {idToken}
```

---

## Authorization Flow - Backend Integration

Your backend API should verify the JWT token from Cognito:

### **Update Your API Gateway to validate Cognito tokens:**

1. **Go to API Gateway**
2. **Select your API**
3. **Authorizers → Create Authorizer**
4. **Type**: Cognito
5. **Cognito User Pool**: Select your user pool
6. **Token Source**: `Authorization`
7. **Save**

8. **For each API method** (POST/GET/PUT/DELETE):
   - Select the method
   - **Method Request → Authorization**
   - Choose your Cognito authorizer
   - **Save**

---

## Troubleshooting

### **"Invalid client id" error**
- Check that your `clientId` in `script.js` matches the Client ID in Cognito
- Make sure you're using the App Client ID, not the User Pool ID

### **"USER_PASSWORD_AUTH not enabled" error**
- Go to App Client → Authentication flows
- Enable "ALLOW_USER_PASSWORD_AUTH"
- Save the changes

### **"Password did not conform to policy" error**
- Password must be at least 8 characters
- Must contain: 1 uppercase letter, 1 number
- Check your password policy in Cognito settings

### **Login works but API calls fail with 401**
- Your backend needs to validate the JWT token
- Make sure the Authorization header is being sent with the `Bearer {idToken}` format
- Verify the token hasn't expired

### **Session expires unexpectedly**
- By default, ID tokens expire in 1 hour
- Implement refresh token logic for longer sessions
- The frontend code can be updated to use `RefreshToken` for new ID tokens

---

## Security Best Practices

1. ✅ **Never expose credentials in code** - Use environment variables
2. ✅ **Use HTTPS** - Always for production
3. ✅ **Implement token refresh** - Before token expiration
4. ✅ **Validate tokens on backend** - Don't trust client-side validation
5. ✅ **Enable MFA** - For sensitive operations
6. ✅ **Set appropriate Password Policies** - Strong passwords
7. ✅ **Use CORS properly** - Allow only trusted origins
8. ✅ **Monitor API usage** - Set up CloudWatch alarms

---

## Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [JWT Token Format](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
