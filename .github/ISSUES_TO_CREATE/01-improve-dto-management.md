## 🔧 Technical Debt Description
Currently, DTOs are manually maintained across multiple classes with duplicated validation logic. Each DTO (CreateUserDto, UpdateUserDto, GetUsersQueryDto, UserResponseDto) requires manual updates when adding new fields, leading to maintenance overhead and potential inconsistencies.

## 🎯 Goals
- Reduce DTO maintenance overhead
- Eliminate duplicate validation logic
- Maintain type safety across the application
- Create a scalable pattern for future entities

## 📋 Tasks
- [ ] Research NestJS mapped-types package integration
- [ ] Implement base DTO pattern with inheritance
- [ ] Refactor existing User DTOs to use new pattern
- [ ] Create utility functions for common DTO operations
- [ ] Update all imports across the codebase
- [ ] Document the new DTO pattern in README
- [ ] Create examples for future DTO implementations

## 🚨 Current Problems
- Manual maintenance of similar DTOs across multiple files
- Duplicate validation decorators (@IsEmail, @IsOptional, etc.)
- Risk of forgetting to update all DTOs when adding entity fields
- Inconsistent DTO patterns across different modules

## ✨ Proposed Solution
Implement a base DTO approach using TypeScript utility types and NestJS mapped-types:
- Create BaseUserDto with all possible fields and validations
- Use PickType and PartialType for specific use cases
- Implement consistent fromEntity transformation methods
- Create reusable DTO utilities

## 📊 Impact Assessment
- **Performance Impact**: None
- **Breaking Changes**: No
- **Migration Required**: No (internal refactor only)
- **Testing Impact**: Low (same functionality, different implementation)

## 🧪 Testing Strategy
- Ensure all existing API endpoints continue to work exactly the same
- Validate that all validation rules are preserved
- Test DTO transformations maintain the same output format
- Verify no sensitive fields are accidentally exposed

## 📅 Timeline
2-3 days

## 🔗 Dependencies
None - this is a standalone refactor that improves the foundation for future work.
