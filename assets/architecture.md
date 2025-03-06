Lucid Chart System Architecture Context:
```
UI

sign in with email
see dashboard, where you can look at tenants
billing per tenant
outstanding balance
their payments
maintenance requests per property
expense tracking per property
Entity Relationship Diagram
Properties
Units
1:many
Tenant- name- 
Payment- name- 
1:many
1:many

User's Browser
API Gateway
Gradio/FastAPI in Lambda
Rent
Important Spreadsheets
selectproperty
(dropdown) Select Tenant
Assignments

Step 1

Entity Relationship Diagram
Decide what actions you want to do to those entities
Payments?
Submit a payment
Can add an image
Edit a payment
Delete a payment?
UI (mockup)
...

Step 2

Decide Gradio or JS

If gradio: do a quick POC
 - deploy a gradio app on lambda
 - try to add Cogito "Authorization Code Flow" grant type (the login flow with JWTs)

If JS
copy/paste the minecraft PaaS (awscdk-minecraft); get the slimmest version of this running that you possibly can
start to fill it in with your pages / logic
GET /dashboard (no token)
Cognito Hosted UI
Return 301 Redirect: /login
GET /login (no token)



Return 301 Redirect: cognito login page URL
If login successful, redirect back to app
GET /login?token=<the new jwt>




sequenceDiagram
    participant User
    participant FastAPI
    participant Cognito
    User->>FastAPI: GET /login
    FastAPI->>User: Redirect to Cognito Login
    User->>Cognito: GET /oauth2/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=REDIRECT_URI
    Cognito->>User: Redirect to /callback?code=AUTH_CODE
    User->>FastAPI: GET /callback?code=AUTH_CODE
    FastAPI->>Cognito: POST /oauth2/token (exchange AUTH_CODE)
    Cognito->>FastAPI: {access_token, id_token} (JWTs)
    FastAPI->>User: Set HttpOnly Cookie {id_token} (JWT stored)
    
    User->>FastAPI: GET /protected (includes Cookie with id_token)
    FastAPI->>Cognito: GET /.well-known/jwks.json (fetch public keys)
    Cognito->>FastAPI: {JWKS Keys}
    FastAPI->>FastAPI: Verify JWT Signature using JWKS
    FastAPI->>FastAPI: Decode JWT, check expiration, verify claims
    FastAPI->>User: Return protected resource if valid

Backend API that serves the frontend HTML
Frontend

Backend API
```