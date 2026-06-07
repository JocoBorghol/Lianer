/*
    Endpoints for Activity controller
*/

/*
// GET activities by user ID
// api/v1/activities/user/{id}
fetch('http://localhost:5297/api/v1/activities/user/123e4567-e89b-12d3-a456-426614174000?currentPage=1&pageSize=1', {
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})

[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "description": "string",
    "assignedTo": null,
    "createdBy": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2026-06-07T03:16:45.948Z",
    "updatedAt": null,
    "status": 1
  }
]



// GET activity by ID
// api/v1/activities/{id}
fetch('http://localhost:5297/api/v1/activities/123e4567-e89b-12d3-a456-426614174000', {
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})
[
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "description": "string",
  "assignedTo": null,
  "createdBy": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-06-07T03:16:45.948Z",
  "updatedAt": null,
  "status": 1
}
]


// POST activity
// api/v1/activities
fetch('http://localhost:5297/api/v1/activities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    description: '',
    assignedTo: null,
    createdBy: '123e4567-e89b-12d3-a456-426614174000',
    startDate: null,
    endDate: null,
    status: null
  })
})
[
{ 
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "description": "string",
  "assignedTo": null,
  "createdBy": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-06-07T03:16:45.948Z",
  "updatedAt": null,
  "status": 1
}

]

// PUT activity
// api/v1/activities
fetch('http://localhost:5297/api/v1/activities', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    id: '123e4567-e89b-12d3-a456-426614174000',
    description: null,
    assignedTo: null,
    startDate: null,
    endDate: null,
    status: null
  })
})
[
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "description": "string",
  "assignedTo": null,
  "createdBy": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-06-07T03:16:45.948Z",
  "updatedAt": null,
  "status": 1
}

]

// DELETE activity by ID
// api/v1/activities/{id}
fetch('http://localhost:5297/api/v1/activities/123e4567-e89b-12d3-a456-426614174000', {
  method: 'DELETE',
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})

// Status: 204
// No Body
// No Content



// GET all activities
// api/v1/activities
fetch('http://localhost:5297/api/v1/activities?currentPage=1&pageSize=1', {
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})

[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "description": "string",
    "assignedTo": null,
    "createdBy": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2026-06-07T03:16:45.948Z",
    "updatedAt": null,
    "status": 1
  }
]

*/