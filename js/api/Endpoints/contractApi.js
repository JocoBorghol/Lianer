/*
    Endpoints for Contacts controller
*/

/*
// GET contact by ID
// api/v1/contacts/{id}
fetch('http://localhost:5297/api/v1/contacts/123e4567-e89b-12d3-a456-426614174000', {
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})
[
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "company": "string",
  "phone": [
    "string"
  ],
  "email": [
    "string"
  ],
  "social": {
    "linkedIn": null,
    "website": null
  },
  "status": 1,
  "assignedTo": null,
  "isFavorite": true,
  "completedAt": null,
  "lastContactDate": null,
  "interactionLog": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "date": "2026-06-07T03:16:45.948Z",
      "type": "string",
      "content": "string",
      "previousStatus": null,
      "newStatus": null
    }
  ]
}
]


// POST contact
// api/v1/contacts
fetch('http://localhost:5297/api/v1/contacts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    firstName: '',
    lastName: '',
    role: '',
    company: '',
    phone: [''],
    email: [''],
    social: {
      linkedIn: null,
      website: null
    },
    status: 1,
    assignedTo: null,
    isFavorite: true
  })
})

"123e4567-e89b-12d3-a456-426614174000"



// PUT contact by ID
// api/v1/contacts/{id}
fetch('http://localhost:5297/api/v1/contacts/123e4567-e89b-12d3-a456-426614174000', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    firstName: null,
    lastName: null,
    role: null,
    company: null,
    phone: null,
    email: null,
    social: null,
    status: null,
    assignedTo: null,
    isFavorite: null,
    completedAt: null,
    lastContactDate: null
  })
})

"123e4567-e89b-12d3-a456-426614174000"



// DELETE contact by ID
// api/v1/contacts/{id}
fetch('http://localhost:5297/api/v1/contacts/123e4567-e89b-12d3-a456-426614174000', {
  method: 'DELETE',
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})

// Status: 204
// No Body
// No Content

*/