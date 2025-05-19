import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Students')

def lambda_handler(event, context):
    print("Event:", json.dumps(event))
    try:
        if 'body' not in event or not event['body']:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,PUT'
                },
                'body': json.dumps({'error': 'Missing request body'})
            }

        if 'pathParameters' not in event or 'id' not in event['pathParameters']:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,PUT'
                },
                'body': json.dumps({'error': "Missing 'id' in path parameters"})
            }

        body = json.loads(event['body'])
        student_id = event['pathParameters']['id']
        required_fields = ['name', 'email', 'major', 'gpa']
        missing_fields = [field for field in required_fields if not body.get(field)]
        if missing_fields:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,PUT'
                },
                'body': json.dumps({'error': f"Missing field(s): {', '.join(missing_fields)}"})
            }

        # Check if student exists
        response = table.get_item(Key={'StudentID': student_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,PUT'
                },
                'body': json.dumps({'error': f"Student with ID {student_id} not found"})
            }

        table.update_item(
            Key={'StudentID': student_id},
            UpdateExpression="SET #name = :name, Email = :email, Major = :major, GPA = :gpa",
            ExpressionAttributeNames={'#name': 'Name'},
            ExpressionAttributeValues={
                ':name': body['name'],
                ':email': body['email'],
                ':major': body['major'],
                ':gpa': Decimal(str(body['gpa']))
            }
        )

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT'
            },
            'body': json.dumps({'message': 'Student updated successfully'})
        }
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT'
            },
            'body': json.dumps({'error': 'Invalid JSON'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,PUT'
            },
            'body': json.dumps({'error': str(e)})
        }