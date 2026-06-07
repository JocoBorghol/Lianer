/*
    Endpoints for Notes controller
*/
/*

//GET 
// api/v1/activities/{activityId}/notes​
fetch('http://localhost:5297/api/v1/activities/123e4567-e89b-12d3-a456-426614174000/notes?currentPage=1&pageSize=1', {
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "activityId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "string",
    "content": "string",
    "createdBy": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2026-06-07T03:16:45.948Z"
  }
]

// GET by note ID 

fetch('http://localhost:5297/api/v1/activities/123e4567-e89b-12d3-a456-426614174000/notes/123e4567-e89b-12d3-a456-426614174000', {
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})
[{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "activityId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "string",
  "content": "string",
  "createdBy": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-06-07T03:16:45.948Z"
}
]



// POST
fetch('http://localhost:5297/api/v1/activities/123e4567-e89b-12d3-a456-426614174000/notes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    title: '',
    content: '',
    createdBy: ''
  })
})

[
    {
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "activityId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "string",
  "content": "string",
  "createdBy": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-06-07T03:16:45.948Z"
}
]


// put by noteid

fetch('http://localhost:5297/api/v1/activities/123e4567-e89b-12d3-a456-426614174000/notes/123e4567-e89b-12d3-a456-426614174000', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  },
  body: JSON.stringify({
    title: null,
    content: null
  })
})

[{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "activityId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "string",
  "content": "string",
  "createdBy": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-06-07T03:16:45.948Z"
}]


//delete

fetch('http://localhost:5297/api/v1/activities/123e4567-e89b-12d3-a456-426614174000/notes/123e4567-e89b-12d3-a456-426614174000', {
  method: 'DELETE',
  headers: {
    Authorization: 'Bearer YOUR_SECRET_TOKEN'
  }
})

*/