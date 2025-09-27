# SB Portal Web - Folder Structure

This document provides a comprehensive overview of the implemented Domain-Driven Design (DDD) and Feature-Based Architecture folder structure.

## Complete Folder Structure

```
src/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                         # Root layout component
│   ├── page.tsx                           # Home page showcasing architecture
│   └── globals.css                        # Global styles
│
├── domains/                               # DDD Domain Layer
│   ├── user/                              # User Domain
│   │   ├── entities/
│   │   │   └── User.ts                    # User entity with business logic
│   │   ├── value-objects/
│   │   │   ├── UserId.ts                  # User ID value object
│   │   │   └── Email.ts                   # Email value object with validation
│   │   ├── repositories/
│   │   │   └── UserRepository.ts          # User repository interface
│   │   ├── services/
│   │   │   └── UserDomainService.ts       # User domain service
│   │   ├── events/
│   │   │   └── UserCreatedEvent.ts        # Domain event for user creation
│   │   └── index.ts                       # User domain barrel exports
│   │
│   ├── product/                           # Product Domain
│   │   ├── entities/
│   │   │   └── Product.ts                 # Product entity
│   │   ├── value-objects/
│   │   │   ├── ProductId.ts               # Product ID value object
│   │   │   └── Money.ts                   # Money value object with currency
│   │   ├── repositories/                  # (Structure created, ready for implementation)
│   │   ├── services/                      # (Structure created, ready for implementation)
│   │   ├── events/                        # (Structure created, ready for implementation)
│   │   └── index.ts                       # Product domain barrel exports
│   │
│   └── order/                             # Order Domain
│       ├── entities/                      # (Structure created, ready for implementation)
│       ├── value-objects/                 # (Structure created, ready for implementation)
│       ├── repositories/                  # (Structure created, ready for implementation)
│       ├── services/                      # (Structure created, ready for implementation)
│       └── events/                        # (Structure created, ready for implementation)
│
├── features/                              # Feature-Based Modules
│   ├── authentication/                    # Authentication Feature
│   │   ├── components/
│   │   │   └── LoginForm.tsx              # Login form component
│   │   ├── hooks/
│   │   │   └── useAuthentication.ts       # Authentication hook
│   │   ├── services/
│   │   │   └── AuthenticationService.ts   # Auth service with API integration
│   │   ├── types/                         # (Structure created, ready for types)
│   │   └── index.ts                       # Authentication feature exports
│   │
│   ├── dashboard/                         # Dashboard Feature
│   │   ├── components/
│   │   │   └── UserStats.tsx              # User statistics component
│   │   ├── hooks/                         # (Structure created, ready for hooks)
│   │   ├── services/                      # (Structure created, ready for services)
│   │   └── types/                         # (Structure created, ready for types)
│   │
│   ├── user-management/                   # User Management Feature
│   │   ├── components/                    # (Structure created, ready for components)
│   │   ├── hooks/                         # (Structure created, ready for hooks)
│   │   ├── services/                      # (Structure created, ready for services)
│   │   └── types/                         # (Structure created, ready for types)
│   │
│   └── product-catalog/                   # Product Catalog Feature
│       ├── components/                    # (Structure created, ready for components)
│       ├── hooks/                         # (Structure created, ready for hooks)
│       ├── services/                      # (Structure created, ready for services)
│       └── types/                         # (Structure created, ready for types)
│
├── shared/                                # Shared Resources
│   ├── components/
│   │   ├── Button.tsx                     # Reusable button component
│   │   └── index.ts                       # Shared components exports
│   ├── hooks/                             # (Structure created, ready for shared hooks)
│   ├── utils/
│   │   ├── validation.ts                  # Validation utilities
│   │   └── index.ts                       # Shared utils exports
│   ├── constants/
│   │   └── api.ts                         # API endpoints and constants
│   └── types/                             # (Structure created, ready for shared types)
│
├── infrastructure/                        # Infrastructure Layer
│   ├── api/
│   │   └── ApiClient.ts                   # HTTP client for API communication
│   ├── storage/                           # (Structure created, ready for storage)
│   ├── external-services/                 # (Structure created, ready for integrations)
│   └── config/                            # (Structure created, ready for config)
│
└── types/
    └── global.ts                          # Global TypeScript definitions
```

## Key Architecture Decisions

### 1. Domain-Driven Design (DDD) Implementation
- **Entities**: Business objects with identity (User, Product)
- **Value Objects**: Immutable objects (UserId, Email, Money)
- **Repositories**: Interfaces for data access patterns
- **Domain Services**: Business logic that spans multiple entities
- **Domain Events**: Important business occurrences

### 2. Feature-Based Organization
- Each feature is self-contained with its own components, hooks, services, and types
- Features can use domain objects but are isolated from each other
- Clear separation of concerns within each feature

### 3. Layered Architecture
- **Presentation Layer**: Next.js app directory (minimal routing)
- **Feature Layer**: Feature-specific UI and application logic
- **Domain Layer**: Pure business logic and rules
- **Infrastructure Layer**: External concerns and integrations
- **Shared Layer**: Common utilities and components

### 4. Import Dependencies
- Domains don't import from features or infrastructure
- Features can import from domains and shared
- Infrastructure can import from domains
- Shared is imported by features

## Benefits of This Structure

### 1. Maintainability
- Clear separation of concerns
- Easy to locate and modify code
- Consistent organization patterns

### 2. Scalability
- Easy to add new domains and features
- Modular architecture supports team growth
- Clear boundaries prevent tight coupling

### 3. Testability
- Isolated business logic in domains
- Feature boundaries make integration testing clear
- Mocking points are well-defined

### 4. Developer Experience
- Intuitive folder structure
- Barrel exports for clean imports
- TypeScript support throughout

## Usage Examples

### Using Domain Objects
```typescript
import { User, Email, UserId } from '../domains/user';

const email = Email.fromString('user@example.com');
const user = User.create(email, 'John Doe');
```

### Using Feature Components
```typescript
import { LoginForm } from '../features/authentication';

function LoginPage() {
  return <LoginForm onSuccess={() => {}} />;
}
```

### Using Shared Components
```typescript
import { Button } from '../shared/components';

function MyComponent() {
  return <Button variant="primary">Click me</Button>;
}
```

## Next Steps for Development

1. **Implement Repository Patterns**: Add concrete implementations in infrastructure
2. **Add More Domain Logic**: Expand entities with business rules
3. **Create Feature Components**: Build out the feature modules
4. **Add Tests**: Implement testing for domains and features
5. **Documentation**: Add JSDoc comments and API documentation

This structure provides a solid foundation for a scalable, maintainable web application following modern architectural principles.