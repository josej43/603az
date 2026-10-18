"""Unit tests with local fake AWS clients; no AWS credentials required."""
import importlib.util
import json
import os
from pathlib import Path
from unittest.mock import MagicMock

import pytest

@pytest.fixture
def api(monkeypatch):
    import boto3
    table=MagicMock()
    dynamo=MagicMock()
    dynamo.Table.return_value=table
    s3=MagicMock()
    sns=MagicMock()
    monkeypatch.setenv('REPORTS_TABLE','test-table')
    monkeypatch.setenv('IMAGE_BUCKET','test-images')
    monkeypatch.setenv('SNS_TOPIC','arn:aws:sns:us-east-1:000000000000:topic')
    monkeypatch.setattr(boto3,'resource',lambda _:dynamo)
    monkeypatch.setattr(boto3,'client',lambda svc:{'s3':s3,'sns':sns}[svc])
    f=Path(__file__).resolve().parents[1]/'backend'/'index.py'
    spec=importlib.util.spec_from_file_location('civic_backend_test',f)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module,table,s3,sns

def event(route, body=None, sub='user-1', staff=False, id=None):
    groups='[Staff]' if staff else ''
    return {'routeKey':route,'body':json.dumps(body or {}),
      'requestContext':{'authorizer':{'jwt':{'claims':{'sub':sub,'cognito:groups':groups}}}},
      'pathParameters':{'id':id} if id else {}}

def result(reply):return reply['statusCode'],json.loads(reply['body'])

def test_anonymous_is_rejected(api):
    m,*_=api
    e=event('GET /reports');e['requestContext']={}
    assert result(m.handler(e,None))[0]==401

def test_required_fields(api):
    m,*_=api
    status,body=result(m.handler(event('POST /reports',{'category':'Other'}),None))
    assert status==400

def test_create_report(api):
    m,table,*_=api
    status,body=result(m.handler(event('POST /reports',{'category':'Roads & Potholes','description':'Dangerous pothole outside station','location':'Station Road','title':'Road hazard'}),None))
    assert status==201
    assert body['status']=='Submitted'
    assert body['ownerSub']=='user-1'
    table.put_item.assert_called_once()

def test_owner_cannot_change_status(api):
    m,*_=api
    status,_=result(m.handler(event('PATCH /reports/{id}',{'status':'Resolved'},id='abc'),None))
    assert status==403

def test_owner_cannot_read_other_user_report(api):
    m,table,*_=api
    table.get_item.return_value={'Item':{'reportId':'abc','ownerSub':'someone-else'}}
    status,_=result(m.handler(event('GET /reports/{id}',id='abc'),None))
    assert status==403

def test_staff_can_read_other_user_report(api):
    m,table,*_=api
    table.get_item.return_value={'Item':{'reportId':'abc','ownerSub':'someone-else'}}
    status,_=result(m.handler(event('GET /reports/{id}',staff=True,id='abc'),None))
    assert status==200

def test_invalid_image_type(api):
    m,*_=api
    status,_=result(m.handler(event('POST /uploads',{'reportId':'abc','contentType':'application/pdf'}),None))
    assert status==400

def test_unsupported_route(api):
    m,*_=api
    assert result(m.handler(event('DELETE /reports/abc'),None))[0]==404
