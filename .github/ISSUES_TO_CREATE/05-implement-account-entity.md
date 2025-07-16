## 🚀 Feature Description
Create an Account/Organization entity system to support multi-tenant architecture where multiple users can belong to accounts/organizations with different roles and permissions.

## 💡 Motivation
- Enable B2B use cases where companies have multiple team members
- Provide foundation for team collaboration features
- Support different billing/subscription models per organization
- Enable proper data isolation between different organizations

## 📋 Acceptance Criteria
- [ ] Create Account entity with proper database schema
- [ ] Implement User-Account many-to-many relationship
- [ ] Add account roles (owner, admin, member, viewer)
- [ ] Implement account-based data isolation middleware
- [ ] Create account invitation system
- [ ] Add account switching functionality for users
- [ ] Implement account creation during user signup flow
- [ ] Add account settings and configuration
- [ ] Create account transfer ownership functionality
- [ ] Add account suspension/deactivation

## 🛠️ Technical Considerations
- Database design for multi-tenancy
- Proper indexing for account-based queries
- Data isolation at the application level
- Account-scoped JWT tokens
- Migration strategy for existing single-user data

## 🎯 Priority
- [x] Medium

## 📱 Affected Areas
- [x] User Management
- [x] API Endpoints
- [x] Database
- [x] Testing

## 📝 Additional Context
This is a foundational change that affects how data is organized. Key decisions:
- Should accounts be mandatory or optional?
- How to handle account-less users during migration?
- Account slug/subdomain support for future features?

Database relationships:
- User belongs to many Accounts
- Account has many Users
- Account has roles/permissions
- All business data should be account-scoped
