---
name: CRUD Implementation
about: Template for implementing CRUD operations
title: '[CRUD] Implement CRUD for [Entity Name]'
labels: ['feature', 'crud']
assignees: 'ConnorDBurge'
---

## 📊 Entity: [Entity Name]

## 🎯 CRUD Operations to Implement

### Create
- [ ] POST `/[endpoint]` - Create new [entity]
- [ ] Validate input data
- [ ] Handle duplicate prevention
- [ ] Return created entity (via DTO)

### Read
- [ ] GET `/[endpoint]` - List all [entities] with pagination
- [ ] GET `/[endpoint]/:id` - Get specific [entity] by ID
- [ ] Implement filtering and search
- [ ] Add query parameters support

### Update
- [ ] PATCH `/[endpoint]/:id` - Update [entity]
- [ ] PUT `/[endpoint]/:id` - Replace [entity] (if needed)
- [ ] Validate partial updates
- [ ] Handle not found scenarios

### Delete
- [ ] DELETE `/[endpoint]/:id` - Delete [entity]
- [ ] Implement soft delete (if required)
- [ ] Handle cascade deletions
- [ ] Return appropriate status codes

## 📋 Additional Requirements
- [ ] Create DTO classes (Create, Update, Response, Query)
- [ ] Implement repository pattern
- [ ] Add service layer with business logic
- [ ] Create controller with proper endpoints
- [ ] Add input validation
- [ ] Implement error handling
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Update API documentation

## 🔗 Related Entities
List any entities that this CRUD relates to or depends on.

## 🛡️ Security Considerations
- [ ] Authentication required
- [ ] Authorization/permission checks
- [ ] Input sanitization
- [ ] Rate limiting (if needed)

## 📝 Notes
Any additional implementation notes or considerations.
