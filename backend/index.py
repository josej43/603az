"""CivicPulse Lambda API for API Gateway HTTP API v2.

Routes (all protected by the CloudFormation Cognito JWT authorizer):
POST /reports; GET /reports; GET /reports/{id}; PATCH /reports/{id}; POST /uploads.
Uses only the existing LabRole and the original stack environment variables.
"""
import datetime
import json
import logging
import os
import re
import uuid
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

log = logging.getLogger(__name__)
log.setLevel(logging.INFO)
TABLE = boto3.resource('dynamodb').Table(os.environ['REPORTS_TABLE'])
S3 = boto3.client('s3')
SNS = boto3.client('sns')
BUCKET = os.environ['IMAGE_BUCKET']
TOPIC = os.environ['SNS_TOPIC']
STATUSES = ('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected')
CATEGORIES = ('Roads & Potholes', 'Street Lighting', 'Drainage & Flooding',
              'Pavements & Footpaths', 'Parks & Public Spaces', 'Waste & Fly-tipping',
              'Signs & Signals', 'Other')
PRIORITIES = ('Low', 'Medium', 'High', 'Critical')
IMAGE_TYPES = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')


def clean(value, limit=200, required=False):
    if value is None:
        value = ''
    if not isinstance(value, str):
        raise ValueError('Expected text value')
    value = value.strip()
    if required and not value:
        raise ValueError('A required field is missing')
    if len(value) > limit:
        raise ValueError(f'Text exceeds {limit} characters')
    return value


def json_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError(f'Cannot serialize {type(obj).__name__}')


def response(code, payload):
    return {'statusCode': code, 'headers': {'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store'}, 'body': json.dumps(payload, default=json_default)}


def user_from_event(event):
    claims = (((event.get('requestContext') or {}).get('authorizer') or {}).get('jwt') or {}).get('claims') or {}
    groups = claims.get('cognito:groups', [])
    if isinstance(groups, str):
        groups = [s.strip(' []"') for s in groups.split(',')]
    return claims.get('sub'), 'Staff' in groups


def announce(text):
    try:
        SNS.publish(TopicArn=TOPIC, Subject='CivicPulse infrastructure update', Message=text)
    except ClientError:
        # A notification failure must not discard a successfully saved report.
        log.exception('SNS publish failed')


def get_report(report_id):
    return TABLE.get_item(Key={'reportId': report_id}, ConsistentRead=True).get('Item')


def owned(report, sub, staff):
    return staff or report.get('ownerSub') == sub


def safe_image_url(key):
    if not key or not key.startswith('reports/'):
        return None
    return S3.generate_presigned_url('get_object', Params={'Bucket': BUCKET, 'Key': key}, ExpiresIn=300)


def add_image_urls(item):
    item = dict(item)
    keys = item.get('imageKeys') or ([item['imageKey']] if item.get('imageKey') else [])
    item['imageUrls'] = [safe_image_url(k) for k in keys[:3]]
    return item


def create_report(body, sub):
    category = clean(body.get('category'), 80, True)
    if category not in CATEGORIES:
        raise ValueError('Invalid category')
    description = clean(body.get('description'), 2000, True)
    location = clean(body.get('location'), 300, True)
    title = clean(body.get('title') or category, 120, True)
    postcode = clean(body.get('postcode'), 24)
    incident_date = clean(body.get('incidentDate'), 20)
    if incident_date and not re.fullmatch(r'\d{4}-\d{2}-\d{2}', incident_date):
        raise ValueError('Incident date must be YYYY-MM-DD')
    priority = clean(body.get('priority') or 'Medium', 20)
    if priority not in PRIORITIES:
        raise ValueError('Invalid priority')
    hazard = bool(body.get('hazard', False))
    accessibility = bool(body.get('accessibility', False))
    contact = clean(body.get('contactPreference') or 'Account', 30)
    if contact not in ('Account', 'Email', 'None'):
        raise ValueError('Invalid contact preference')
    latitude = body.get('latitude')
    longitude = body.get('longitude')
    coords = {}
    if latitude is not None or longitude is not None:
        try:
            lat, lon = float(latitude), float(longitude)
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError()
            coords = {'latitude': Decimal(str(lat)), 'longitude': Decimal(str(lon))}
        except (TypeError, ValueError):
            raise ValueError('Invalid coordinates')
    timestamp = utc_now()
    item = {'reportId': str(uuid.uuid4()), 'ownerSub': sub, 'title': title,
            'category': category, 'description': description, 'location': location,
            'postcode': postcode, 'incidentDate': incident_date, 'priority': priority,
            'hazard': hazard, 'accessibility': accessibility, 'contactPreference': contact,
            'status': 'Submitted', 'createdAt': timestamp, 'updatedAt': timestamp,
            'history': [{'status': 'Submitted', 'at': timestamp, 'by': 'Citizen'}],
            'imageKeys': [], **coords}
    TABLE.put_item(Item=item, ConditionExpression='attribute_not_exists(reportId)')
    announce(f'New {category} report submitted: {item["reportId"]} ({location})')
    return response(201, item)


def list_reports(sub, staff):
    if staff:
        result = TABLE.scan(Limit=100)
    else:
        result = TABLE.query(IndexName='OwnerCreatedAt',
                             KeyConditionExpression=Key('ownerSub').eq(sub),
                             ScanIndexForward=False, Limit=100)
    items = result.get('Items', [])
    items.sort(key=lambda r: r.get('createdAt', ''), reverse=True)
    return response(200, {'items': items, 'hasMore': bool(result.get('LastEvaluatedKey'))})


def update_report(report_id, body, sub):
    current = get_report(report_id)
    if not current:
        return response(404, {'error': 'Report not found'})
    status = clean(body.get('status') or current.get('status'), 30)
    if status not in STATUSES:
        raise ValueError('Invalid status')
    assigned_to = clean(body.get('assignedTo', current.get('assignedTo', '')), 100)
    priority = clean(body.get('priority', current.get('priority', 'Medium')), 20)
    if priority not in PRIORITIES:
        raise ValueError('Invalid priority')
    note = clean(body.get('note'), 500)
    timestamp = utc_now()
    history = list(current.get('history', []))[-39:]
    if status != current.get('status') or note:
        history.append({'status': status, 'at': timestamp, 'by': 'Staff', 'note': note})
    # Optimistic concurrency prevents silent overwrites by two staff members.
    result = TABLE.update_item(Key={'reportId': report_id},
        UpdateExpression='SET #s = :s, updatedAt = :u, assignedTo = :a, priority = :p, history = :h',
        ConditionExpression='attribute_exists(reportId) AND updatedAt = :previous',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':s': status, ':u': timestamp, ':a': assigned_to,
                                   ':p': priority, ':h': history, ':previous': current['updatedAt']},
        ReturnValues='ALL_NEW')
    if status != current.get('status'):
        announce(f'Report {report_id} status changed to {status}')
    return response(200, result['Attributes'])


def create_upload(body, sub, staff):
    report_id = clean(body.get('reportId'), 100, True)
    content_type = clean(body.get('contentType'), 40, True)
    if content_type not in IMAGE_TYPES:
        raise ValueError('Only JPEG, PNG and WebP images are supported')
    report = get_report(report_id)
    if not report:
        return response(404, {'error': 'Report not found'})
    if not owned(report, sub, staff):
        return response(403, {'error': 'Access denied'})
    keys = list(report.get('imageKeys') or ([report['imageKey']] if report.get('imageKey') else []))
    if len(keys) >= 3:
        return response(400, {'error': 'Maximum of three images per report'})
    key = f'reports/{report_id}/{uuid.uuid4()}.{IMAGE_TYPES[content_type]}'
    url = S3.generate_presigned_url('put_object',
        Params={'Bucket': BUCKET, 'Key': key, 'ContentType': content_type}, ExpiresIn=300)
    keys.append(key)
    TABLE.update_item(Key={'reportId': report_id},
        UpdateExpression='SET imageKeys = :keys, imageKey = :last, updatedAt = :now',
        ConditionExpression='attribute_exists(reportId)',
        ExpressionAttributeValues={':keys': keys, ':last': key, ':now': utc_now()})
    return response(200, {'uploadUrl': url, 'imageKey': key, 'expiresIn': 300})


def handler(event, context):
    route = event.get('routeKey', '')
    sub, staff = user_from_event(event)
    if not sub:
        return response(401, {'error': 'Authentication required'})
    params = event.get('pathParameters') or {}
    try:
        body = json.loads(event.get('body') or '{}')
        if not isinstance(body, dict):
            return response(400, {'error': 'JSON body must be an object'})
    except (ValueError, TypeError):
        return response(400, {'error': 'Invalid JSON'})
    try:
        if route == 'POST /reports':
            return create_report(body, sub)
        if route == 'GET /reports':
            return list_reports(sub, staff)
        if route == 'GET /reports/{id}':
            report = get_report(params.get('id', ''))
            if not report:
                return response(404, {'error': 'Report not found'})
            if not owned(report, sub, staff):
                return response(403, {'error': 'Access denied'})
            return response(200, add_image_urls(report))
        if route == 'PATCH /reports/{id}':
            if not staff:
                return response(403, {'error': 'Staff access required'})
            return update_report(params.get('id', ''), body, sub)
        if route == 'POST /uploads':
            return create_upload(body, sub, staff)
        return response(404, {'error': 'Route not found'})
    except ValueError as exc:
        return response(400, {'error': str(exc)})
    except TABLE.meta.client.exceptions.ConditionalCheckFailedException:
        return response(409, {'error': 'Record changed or was removed. Refresh and retry.'})
    except ClientError:
        log.exception('AWS operation failed')
        return response(500, {'error': 'AWS operation failed. Check LabRole permissions and CloudWatch logs.'})
    except Exception:
        log.exception('Unexpected backend failure')
        return response(500, {'error': 'Internal server error'})
