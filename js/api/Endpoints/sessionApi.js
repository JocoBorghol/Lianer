/*
    Endpoints for Sessions controller
*/


// POST login session
// api/v1/sessions
fetch('http://localhost:5297/api/v1/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    email: '',
    password: ''
  })
})

[{
  "accessToken": "string",
  "tokenType": "string",
  "expiresIn": 1,
  "user": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
}
]


// DELETE session by ID
// api/v1/sessions/{id}
fetch('http://localhost:5297/api/v1/sessions/123e4567-e89b-12d3-a456-426614174000', {
  method: 'DELETE',
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})

// Status: 204
// No Body
// No Content



// POST Google login session
// api/v1/sessions/google
fetch('http://localhost:5297/api/v1/sessions/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    accessToken: ''
  })
})
[
{
  "accessToken": "string",
  "tokenType": "string",
  "expiresIn": 1,
  "user": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
}]



// GET Google login URL
// api/v1/sessions/google/url
fetch('http://localhost:5297/api/v1/sessions/google/url', {
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})

// Status: 200
// No Body
// OK