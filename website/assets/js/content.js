window.Content = Object.freeze({
 categories:['Roads & Potholes','Street Lighting','Drainage & Flooding','Pavements & Footpaths','Parks & Public Spaces','Waste & Fly-tipping','Signs & Signals','Other'],
 priorities:['Low','Medium','High','Critical'],
 statuses:['Submitted','Under Review','Assigned','In Progress','Resolved','Rejected'],
 features:[
  {icon:'pin',number:'01',title:'Pinpoint the problem',desc:'Report damaged roads, lighting faults, drainage issues and other public infrastructure concerns with accurate locations.'},
  {icon:'camera',number:'02',title:'Attach visual evidence',desc:'Add up to three photos to help maintenance teams understand the issue and assess its urgency.'},
  {icon:'clock',number:'03',title:'Follow every update',desc:'Track your submitted reports through review, assignment, maintenance and resolution.'},
  {icon:'shield',number:'04',title:'Privacy by design',desc:'Private citizen reports, account-based access, restricted staff privileges and secure object storage.'},
  {icon:'chart',number:'05',title:'Actionable operations',desc:'A dedicated staff workspace for prioritising issues, assigning work and maintaining a status history.'},
  {icon:'bolt',number:'06',title:'Built on AWS',desc:'A serverless application using Cognito, API Gateway, Lambda, DynamoDB and Amazon S3.'}
 ],
 faq:[
  ['Do I need an account?','Yes. Create a free demonstration account, verify your email, then sign in to submit and view your own reports.'],
  ['Can anyone view my reports?','No. Citizen API access is scoped to the account owner. Authorised staff can view reports for maintenance management.'],
  ['What can I report?','Potholes, streetlights, footpaths, flooding, signs, waste and other public-space issues. Do not use this demonstration for emergencies.'],
  ['How many photos can I upload?','Up to three JPEG, PNG or WebP images, each up to 5 MB. Uploads use time-limited signed S3 links.'],
  ['Will someone fix the issue?','This is an educational demonstration, not an official council reporting channel. Reports are not automatically forwarded to local authorities.'],
  ['How do email alerts work?','An administrator can configure an Amazon SNS email subscription, which must be confirmed by the recipient.']
 ]
});
