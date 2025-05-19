import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Students')

def lambda_handler(event, context):
    print("Event:", json.dumps(event))
    try:
        if 'pathParameters' not in event or 'id' not in event['pathParameters']:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
                },
                'body': json.dumps({'error': "Missing 'id' in path parameters"})
            }

        student_id = event['pathParameters']['id']
        response = table.get_item(Key={'StudentID': student_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
                },
                'body': json.dumps({'error': f"Student with ID {student_id} not found"})
            }

        table.delete_item(Key={'StudentID': student_id})
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
            },
            'body': json.dumps({'message': 'Student deleted successfully'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
            },
            'body': json.dumps({'error': str(e)})
        }