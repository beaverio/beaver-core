## 🚀 Feature Description
Implement Role-Based Access Control (RBAC) system to support different user permission levels across the application, enabling fine-grained access control for different features and resources.

## 💡 Motivation
- Support different user types (admin, user, viewer, etc.)
- Enable account-level permissions and roles
- Provide foundation for enterprise features
- Ensure proper security and access control

## 📋 Acceptance Criteria
- [ ] Create Role entity with permissions system
- [ ] Implement user-role relationships
- [ ] Create role-based guards and decorators (@Roles, @RequirePermission)
- [ ] Add permission checking middleware
- [ ] Implement system-level roles (super admin, admin, user)
- [ ] Add account-level roles (account owner, admin, member, viewer)
- [ ] Create role management CRUD operations
- [ ] Update JWT tokens to include role information
- [ ] Add role-based route protection
- [ ] Implement permission inheritance system

## 🛠️ Technical Considerations
- Database design for roles and permissions
- JWT token size considerations (roles in payload)
- Permission caching strategies
- Role hierarchy and inheritance
- Migration strategy for existing users

## 🎯 Priority
- [x] Medium

## 📱 Affected Areas
- [x] Authentication
- [x] User Management
- [x] API Endpoints
- [x] Database
- [x] Testing

## 📝 Additional Context
RBAC Structure:
- **System Roles**: Super Admin, Admin, User
- **Account Roles**: Owner, Admin, Member, Viewer
- **Permissions**: Fine-grained permissions for specific actions

Implementation approach:
- Roles can have multiple permissions
- Users can have multiple roles (system + account roles)
- Permission checks at endpoint level
- Middleware for automatic role validation

This should integrate with:
- Existing authentication system
- Account management (Issue #5, #6)
- Future admin panel features
