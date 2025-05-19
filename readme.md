# Student Registration CRUD Application

This project implements a serverless Student Registration system with a RESTful CRUD API using AWS Lambda, API Gateway, and DynamoDB, integrated with a responsive frontend UI in a white and blue minimal theme. The application supports creating, reading, updating, and deleting student records. Future plans include CI/CD integration using GitHub Actions and AWS SAM.

## Features
- **Backend**:
  - CRUD API for student registration (Create, Read, Update, Delete).
  - AWS Lambda functions in Python for each CRUD operation.
  - DynamoDB table `Students` for data storage.
  - API Gateway REST API with public endpoints.
- **Frontend**:
  - Single-page application with HTML, CSS, and JavaScript (jQuery).
  - Minimal white and blue theme with a form for CRUD operations and a table for displaying student data.
  - Hosted on AWS S3 as a static website.
- **Deployment**:
  - Serverless architecture on AWS (Lambda, API Gateway, DynamoDB, S3).
  - Instructions for manual deployment and future CI/CD setup.

## Architecture
- **Database**: DynamoDB table `Students` with `StudentID` (partition key), `Name`, `Email`, `Major`, and `GPA`.
- **API Endpoints**:
  - `POST /students`: Create a student.
  - `GET /students/{id}`: Retrieve a student by ID.
  - `PUT /students/{id}`: Update a student.
  - `DELETE /students/{id}`: Delete a student.
- **Frontend**: Hosted on S3, interacts with API Gateway via AJAX calls.
- **Future CI/CD**: GitHub Actions with AWS SAM for automated deployments.

## Prerequisites
- AWS account with permissions for Lambda, API Gateway, DynamoDB, S3, and IAM.
- AWS CLI configured with credentials.
- Python 3.9 or later for Lambda functions.
- Node.js (optional for local testing).
- Git for version control.

## Project Structure
```
student-registration/
├── frontend/
│   ├── index.html        # Main HTML for frontend
│   ├── style.css        # CSS for white and blue theme
│   ├── script.js        # JavaScript for CRUD operations
├── lambda/
│   ├── create_student.py  # Lambda for POST /students
│   ├── get_student.py     # Lambda for GET /students/{id}
│   ├── update_student.py  # Lambda for PUT /students/{id}
│   ├── delete_student.py  # Lambda for DELETE /students/{id}
├── template.yaml          # AWS SAM template (for CI/CD)
├── README.md             # This file
```

## Setup and Deployment

### 1. DynamoDB Table
Create a DynamoDB table named `Students`:
```bash
aws dynamodb create-table \
  --table-name Students \
  --attribute-definitions AttributeName=StudentID,AttributeType=S \
  --key-schema AttributeName=StudentID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region ap-southeast-1
```
- **Partition Key**: `StudentID` (String).
- **Attributes**: `Name` (String), `Email` (String), `Major` (String), `GPA` (Number).

### 2. Lambda Functions
Deploy four Lambda functions for CRUD operations:

#### Create Student (`create_student.py`)
- Handles `POST /students`.
- Validates `studentID`, `name`, `email`, `major`, `gpa`.
- Checks for existing student before creating.

#### Get Student (`get_student.py`)
- Handles `GET /students/{id}`.
- Retrieves student by `StudentID`.

#### Update Student (`update_student.py`)
- Handles `PUT /students/{id}`.
- Updates `name`, `email`, `major`, `gpa` for an existing student.

#### Delete Student (`delete_student.py`)
- Handles `DELETE /students/{id}`.
- Deletes a student by `StudentID`.

**Deployment Steps**:
1. In AWS Console, go to **Lambda** > **Create Function**.
2. For each function:
   - Name: e.g., `create_student`.
   - Runtime: Python 3.9.
   - Copy the respective `.py` code from the `lambda/` directory.
   - Set timeout to 30 seconds.
   - Attach an IAM role with:
     ```json
     {
         "Version": "2012-10-17",
         "Statement": [
             {
                 "Effect": "Allow",
                 "Action": [
                     "dynamodb:PutItem",
                     "dynamodb:GetItem",
                     "dynamodb:UpdateItem",
                     "dynamodb:DeleteItem",
                     "logs:CreateLogGroup",
                     "logs:CreateLogStream",
                     "logs:PutLogEvents"
                 ],
                 "Resource": [
                     "arn:aws:dynamodb:ap-southeast-1:<your-account-id>:table/Students",
                     "arn:aws:logs:ap-southeast-1:<your-account-id>:*"
                 ]
             }
         ]
     }
     ```
3. Deploy each function.

## API Gateway Structure


```
/ (root)
└── students
    ├── POST (Lambda: createItemLambda)
    └── {id}
        ├── GET (Lambda: getItemsLambda)
        ├── PUT (Lambda: updateItemLambda)
        └── DELETE (Lambda: deleteItemLambda)
```
### 3. API Gateway Setup
1. **Create REST API**:
   - In AWS Console, go to **API Gateway** > **Create API** > **REST API** > Build.
   - Name: `StudentAPI`.
   - Endpoint Type: Regional.

2. **Create Resources**:
   - Resource: `/students`.
   - Sub-Resource: `/students/{id}`.

3. **Create Methods**:
   - **POST /students**:
     - Integration: Lambda Function (`create_student`).
     - Enable Lambda Proxy Integration.
     - Authorization: NONE.
   - **GET /students/{id}**:
     - Integration: Lambda Function (`get_student`).
     - Enable Lambda Proxy Integration.
     - Authorization: NONE.
   - **PUT /students/{id}**:
     - Integration: Lambda Function (`update_student`).
     - Enable Lambda Proxy Integration.
     - Authorization: NONE.
   - **DELETE /students/{id}**:
     - Integration: Lambda Function (`delete_student`).
     - Enable Lambda Proxy Integration.
     - Authorization: NONE.

4. **Enable CORS**:
   - For `/students` and `/students/{id}`, enable CORS.
   - Ensure OPTIONS methods are created with mock integrations.

5. **Deploy API**:
   - **Actions** > **Deploy API** > Stage: `deploy`.
   - Note the Invoke URL (e.g., `https://<your-api-id>.execute-api.ap-southeast-1.amazonaws.com/deploy`).
   - Update `script.js` with the full URL: `https://<your-api-id>.execute-api.ap-southeast-1.amazonaws.com/deploy/students`.

### 4. Frontend Deployment
1. **Create S3 Bucket**:
   - In AWS Console, go to **S3** > **Create Bucket**.
   - Name: e.g., `student-registration-frontend`.
   - Region: `ap-southeast-1`.
   - Disable **Block All Public Access**.

2. **Configure Bucket for Static Hosting**:
   - Go to bucket > **Properties** > **Static Website Hosting** > Enable.
   - Index Document: `index.html`.

3. **Set Bucket Policy**:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::student-registration-frontend/*"
           }
       ]
   }
   ```

4. **Upload Files**:
   - Upload `index.html`, `style.css`, `script.js` from the `frontend/` directory to the bucket.

5. **Access Frontend**:
   - Use the S3 website endpoint (e.g., `http://student-registration-frontend.s3-website-ap-southeast-1.amazonaws.com`).

### 5. Testing
#### Postman
- **Create**:
```json
{
  "studentID": "0001",
  "name": "John Doe",
  "email": "john@example.com",
  "major": "Computer Science",
  "gpa": "3.5"
}
```
  ```bash
  curl -X POST \
    https://<your-api-id>.execute-api.ap-southeast-1.amazonaws.com/deploy/students \
    -H "Content-Type: application/json" \
    -d '{"studentID":"S001","name":"John Doe","email":"john@example.com","major":"Computer Science","gpa":3.5}'
  ```
- **Get**:
  ```bash
  curl -X GET \
    https://<your-api-id>.execute-api.ap-southeast-1.amazonaws.com/deploy/students/S001
  ```
- **Update**:
  ```bash
  curl -X PUT \
    https://<your-api-id>.execute-api.ap-southeast-1.amazonaws.com/deploy/students/S001 \
    -H "Content-Type: application/json" \
    -d '{"name":"John Doe","email":"john.doe@example.com","major":"Data Science","gpa":3.7}'
  ```
- **Delete**:
  ```bash
  curl -X DELETE \
    https://<your-api-id>.execute-api.ap-southeast-1.amazonaws.com/deploy/students/S001
  ```

#### Frontend
- Open the S3 website URL.
- Test creating, retrieving, updating, and deleting a student.
- Check browser console for errors.

### 6. Frontend UI
- **Theme**: White and blue minimal design.
- **Components**:
  - Form with fields: Student ID, Name, Email, Major, GPA.
  - Buttons for Create, Get, Update, Delete, and Clear.
  - Table to display retrieved student data.
- **Features**:
  - Responsive design with mobile support.
  - Input validation (e.g., GPA between 0 and 4).
  - Success/error messages with fade-out effect.

