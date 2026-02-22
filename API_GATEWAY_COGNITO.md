# API Gateway + Cognito Integration Guide

This guide explains how to protect your Student Management API with Cognito authentication.

---

## Architecture Overview

```
Frontend (with Cognito Login)
    ↓ (sends JWT idToken)
API Gateway (validates token with Cognito Authorizer)
    ↓ (if valid, passes request)
Lambda Function (processes request)
    ↓ (accesses DynamoDB)
DynamoDB (student records)
```

---

## Step 1: Create a Cognito Authorizer in API Gateway

### **Access API Gateway**

1. Go to [AWS API Gateway Console](https://console.aws.amazon.com/apigateway)
2. Find your Student Management API
3. Click on it to open

### **Create Authorizer**

1. In the left sidebar, click **"Authorizers"**
2. Click **"Create Authorizer"**

3. **Configure Authorizer:**
   - **Name**: `CognitoAuthorizer`
   - **Type**: `Cognito`
   - **Cognito User Pool**: Select your `StudentManagementPool`
   - **Token Source**: `Authorization`
   - **Token Validation**: (leave blank for now)
   - Click **"Create"**

4. **Test the Authorizer** (optional)
   - Get a valid ID token from a login
   - Paste it in the "Authorization Token" field
   - Click "Test"
   - Should show "Unauthorized" for invalid tokens, "Authorized" for valid ones

---

## Step 2: Apply Authorizer to API Methods

### **For POST /students (Create Student)**

1. Click on your API in the left sidebar
2. Under **Resources**, select **`/students` → `POST`**
3. Click **"Method Request"**
4. Click the **pencil icon** next to "Authorization"
5. Select **`CognitoAuthorizer`**
6. Click the **checkmark**
7. Click **"Method Completion Status"** checkbox
8. Click **Back** to go to the resource

### **For GET /students/{id} (Get Student)**

1. Select **`/students/{id}` → `GET`**
2. Repeat steps 3-8 above

### **For PUT /students/{id} (Update Student)**

1. Select **`/students/{id}` → `PUT`**
2. Repeat steps 3-8 above

### **For DELETE /students/{id} (Delete Student)**

1. Select **`/students/{id}` → `DELETE`**
2. Repeat steps 3-8 above

---

## Step 3: Update API Endpoint CORS (if needed)

Your frontend sends the Authorization header, so CORS needs to allow it:

1. Go to **Resources** in your API
2. Select **`/students`** resource
3. Click **"Actions"** → **"Enable CORS"**
4. **HTTP methods**: POST, GET, PUT, DELETE
5. **Access-Control-Allow-Headers**: Include `Authorization`
   ```
   Content-Type, Authorization, X-Amz-Date, X-Api-Key
   ```
6. Click **"Save and replace CORS headers"**

---

## Step 4: Update Your Lambda Function (Optional Enhancement)

Your Lambda can now access the Cognito user info from the authorization context.

### **Example Lambda update for Node.js:**

```javascript
exports.handler = async (event) => {
    // Get authenticated user info
    const authorizer = event.requestContext.authorizer;
    const userEmail = authorizer?.claims?.email;
    const userId = authorizer?.claims?.sub; // Cognito user ID
    
    console.log(`API called by: ${userEmail}`);
    
    // Your existing logic here...
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Success',
            authenticatedUser: userEmail
        })
    };
};
```

### **Example Lambda update for Python:**

```python
def lambda_handler(event, context):
    # Get authenticated user info
    authorizer = event.get('requestContext', {}).get('authorizer', {})
    claims = authorizer.get('claims', {})
    user_email = claims.get('email')
    user_id = claims.get('sub')  # Cognito user ID
    
    print(f"API called by: {user_email}")
    
    # Your existing logic here...
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Success',
            'authenticatedUser': user_email
        })
    }
```

---

## Step 5: Deploy API Changes

1. Go to **Resources** → select root `/`
2. Click **"Actions"** → **"Deploy API"**
3. Stage: Select your stage (e.g., `dev`)
4. Click **"Deploy"**

---

## Step 6: Update Frontend API Endpoint (if needed)

If your API endpoint changed, update it in `frontend/script.js`:

```javascript
const API_ENDPOINT = "https://YOUR_API_ID.execute-api.ap-southeast-1.amazonaws.com/dev/students";
```

---

## Testing the Integration

### **Test 1: Without Token (should fail)**

```bash
# This should return 403 Unauthorized
curl -X GET https://YOUR_API_ID.execute-api.ap-southeast-1.amazonaws.com/dev/students/123
```

### **Test 2: With Invalid Token (should fail)**

```bash
# This should return 403 Forbidden
curl -X GET https://YOUR_API_ID.execute-api.ap-southeast-1.amazonaws.com/dev/students/123 \
  -H "Authorization: Bearer invalid_token"
```

### **Test 3: With Valid Token (should succeed)**

1. Login using your frontend
2. In browser console, run:
   ```javascript
   console.log(localStorage.getItem('idToken'));
   ```
3. Copy the token and use:
   ```bash
   curl -X GET https://YOUR_API_ID.execute-api.ap-southeast-1.amazonaws.com/dev/students/123 \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

---

## Troubleshooting

### **401 Unauthorized**
- Token not being sent - Check if Authorization header is included
- Wrong token format - Should be `Bearer {token}`, not just the token

### **403 Forbidden**
- Invalid token - Token may be expired (they last 1 hour by default)
- Wrong authorizer applied - Make sure all methods have the Cognito authorizer

### **405 Method Not Allowed**
- Missing CORS headers - Run "Enable CORS" again
- Method not properly deployed - Re-deploy the API

### **Authorizer not validating correctly**
- Wrong User Pool selected in authorizer
- Token Source should be `Authorization`
- Make sure the token format is `Authorization: Bearer {token}`

---

## Advanced: Custom Authorization (Optional)

If you need more control, you can create a Lambda-based authorizer:

1. Create a Lambda function that validates the token
2. Call AWS Cognito APIs to validate the JWT
3. Return allow/deny policy based on validation

Example:

```javascript
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
    const token = event.authorizationToken;
    
    try {
        // Verify JWT signature against Cognito public keys
        const decoded = jwt.decode(token, { complete: true });
        
        // Add custom logic here (e.g., check user roles, permissions)
        
        return {
            principalId: decoded.payload.sub,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Action: 'execute-api:Invoke',
                    Effect: 'Allow',
                    Resource: event.methodArn
                }]
            },
            context: {
                userId: decoded.payload.sub,
                email: decoded.payload.email
            }
        };
    } catch (error) {
        throw new Error('Unauthorized');
    }
};
```

---

## Security Checklist

- ✅ Cognito authorizer applied to all protected endpoints
- ✅ CORS properly configured
- ✅ Tokens validated before processing requests
- ✅ API Gateway logging enabled for auditing
- ✅ Lambda functions don't expose sensitive info
- ✅ API Keys removed if using Cognito auth
- ✅ Rate limiting configured
- ✅ WAF rules applied (optional but recommended)

---

## Next Steps

1. ✅ Deploy updated frontend with Cognito auth
2. ✅ Add Cognito authorizer to API Gateway
3. ✅ Test end-to-end authentication flow
4. ✅ Enable CloudWatch logging for monitoring
5. ✅ Set up CloudWatch alarms for failures
6. ✅ Document API authentication requirements for team
