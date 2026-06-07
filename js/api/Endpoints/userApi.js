/*
    Endpoints for Users controller
*/


// GET all users
// api/v1/users
fetch('http://localhost:5297/api/v1/users', {
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})

[
  {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "fullName": "string",
    "email": "string"
  }
]



// POST user
// api/v1/users
fetch('http://localhost:5297/api/v1/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })
})

"123e4567-e89b-12d3-a456-426614174000"



// GET user by ID
// api/v1/users/{id}
fetch('http://localhost:5297/api/v1/users/123e4567-e89b-12d3-a456-426614174000', {
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})

[
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "fullName": "string",
  "email": "string"
}
    
]



// PUT user by ID
// api/v1/users/{id}
fetch('http://localhost:5297/api/v1/users/123e4567-e89b-12d3-a456-426614174000', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: null,
    lastName: null,
    email: null
  })
})
 


// DELETE user by ID
// api/v1/users/{id}
fetch('http://localhost:5297/api/v1/users/123e4567-e89b-12d3-a456-426614174000', {
  method: 'DELETE',
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})
 