
# 1. Create Action Item
# Expected: { id: ..., content: "Email client", is_complete: false ... }
curl -X POST http://localhost:3000/api/tasks/details/101/action-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{ "content": "Email client", "assignee_id": 1 }'

# 2. Update Action Item (Complete)
# Expected: { ..., is_complete: true }
# Replace :id with the ID from step 1
curl -X PUT http://localhost:3000/api/tasks/details/action-items/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{ "is_complete": true }'

# 3. Update Action Item (Rename)
# Expected: { ..., content: "Email new client" }
curl -X PUT http://localhost:3000/api/tasks/details/action-items/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{ "content": "Email new client" }'

# 4. Delete Action Item
# Expected: { "success": true }
curl -X DELETE http://localhost:3000/api/tasks/details/action-items/:id \
  -H "Authorization: Bearer <YOUR_TOKEN>"

# 5. Verify Activity Log
# Check the activity feed for "added action item", "marked ... as complete", etc.
curl -X GET http://localhost:3000/api/tasks/details/101 \
  -H "Authorization: Bearer <YOUR_TOKEN>"
