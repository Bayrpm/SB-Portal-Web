# SB Portal Web - Architecture Guide

This document describes the Domain-Driven Design (DDD) and Feature-Based Architecture implemented in the SB Portal Web application.

## Architecture Overview

The application follows a hybrid approach combining Domain-Driven Design principles with Feature-Based Architecture to create a maintainable, scalable, and well-organized codebase.

```
src/
├── app/                    # Next.js App Router (minimal routing logic)
├── domains/               # DDD Domain Layer
├── features/             # Feature-Based Modules
├── shared/               # Shared Resources
├── infrastructure/       # External Concerns
└── types/               # Global TypeScript Definitions
```

## Domain-Driven Design (DDD) Layer

The `domains/` directory contains the core business logic organized by domain contexts:

### Structure
```
domains/
├── user/
│   ├── entities/         # Business entities (User.ts)
│   ├── value-objects/    # Value objects (UserId.ts, Email.ts)
│   ├── repositories/     # Repository interfaces
│   ├── services/         # Domain services
│   ├── events/          # Domain events
│   └── index.ts         # Domain exports
├── product/
│   └── ...
└── order/
    └── ...
```

### Key Concepts

- **Entities**: Objects with identity that encapsulate business logic
- **Value Objects**: Immutable objects that describe characteristics
- **Repositories**: Interfaces for data persistence (implementation in infrastructure)
- **Domain Services**: Business logic that doesn't belong to a single entity
- **Domain Events**: Events that represent important business occurrences

### Example Usage

```typescript
import { User, Email, UserId } from '../domains/user';

// Create a new user
const email = Email.fromString('user@example.com');
const user = User.create(email, 'John Doe');

// Use value objects for type safety
const userId = UserId.fromString('uuid-string');
```

## Feature-Based Architecture

The `features/` directory organizes code by application features, each being self-contained:

### Structure
```
features/
├── authentication/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Feature-specific services
│   ├── types/           # Feature-specific types
│   └── index.ts         # Feature exports
├── dashboard/
├── user-management/
└── product-catalog/
```

### Benefits

- **Encapsulation**: Each feature contains all its related code
- **Scalability**: Easy to add new features without affecting others
- **Team Collaboration**: Teams can work on features independently
- **Testing**: Clear boundaries for unit and integration tests

### Example Usage

```typescript
import { LoginForm, useAuthentication } from '../features/authentication';

// Use feature components and hooks
function LoginPage() {
  const { login, isLoading } = useAuthentication();
  return <LoginForm onSuccess={() => {}} />;
}
```

## Shared Resources

The `shared/` directory contains reusable code across features:

### Structure
```
shared/
├── components/          # Reusable UI components
├── hooks/              # Reusable custom hooks
├── utils/              # Utility functions
├── constants/          # Application constants
└── types/              # Shared type definitions
```

### Guidelines

- Only add code that's truly reusable across multiple features
- Maintain clear APIs and good documentation
- Follow the principle of least surprise

## Infrastructure Layer

The `infrastructure/` directory handles external concerns:

### Structure
```
infrastructure/
├── api/                # API clients and configurations
├── storage/            # Database and storage implementations
├── external-services/  # Third-party service integrations
└── config/             # Configuration management
```

### Responsibilities

- Implement repository interfaces from domains
- Handle external API communications
- Manage configuration and environment variables
- Provide adapters for third-party services

## Global Types

The `types/` directory contains TypeScript definitions used across the application:

- API response types
- Common interfaces
- Utility types
- Global enums

## Best Practices

### Domain Layer
1. Keep business logic in the domain layer
2. Use value objects for validation and type safety
3. Domain entities should not depend on external frameworks
4. Repository interfaces belong in the domain, implementations in infrastructure

### Feature Layer
1. Each feature should be self-contained
2. Minimize dependencies between features
3. Use the shared layer for truly common functionality
4. Follow consistent naming conventions

### Imports and Dependencies
1. Domains should not import from features or infrastructure
2. Features can import from domains and shared
3. Infrastructure can import from domains
4. Use barrel exports (index.ts) for clean imports

### Example Dependency Flow
```
Features → Domains ← Infrastructure
    ↓         ↑
  Shared ←────┘
```

## File Naming Conventions

- **PascalCase**: Components, Classes, Types (`LoginForm.tsx`, `User.ts`)
- **camelCase**: Functions, variables, hooks (`useAuthentication.ts`)
- **kebab-case**: File names when needed (`user-management/`)
- **UPPER_CASE**: Constants (`API_ENDPOINTS`)

## Testing Strategy

### Domain Layer
- Unit tests for entities and value objects
- Test business logic thoroughly
- Mock repository interfaces

### Feature Layer
- Component testing with React Testing Library
- Hook testing with React Testing Library hooks
- Integration tests for feature workflows

### Infrastructure Layer
- Mock external dependencies
- Test repository implementations
- API client integration tests

## Development Workflow

1. **Start with the Domain**: Define entities, value objects, and business rules
2. **Create Feature Structure**: Set up components, hooks, and services
3. **Implement Infrastructure**: Add API clients and external integrations
4. **Add Shared Resources**: Extract common functionality as needed
5. **Update Types**: Add or modify global types as required

## Migration Guide

When adding new features or domains:

1. Create the domain structure first
2. Implement the feature using domain objects
3. Add infrastructure implementations
4. Extract shared resources if needed
5. Update documentation and types

## Tools and Libraries

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **UUID**: For generating unique identifiers
- **ESLint**: Code linting and formatting

## Further Reading

- [Domain-Driven Design by Eric Evans](https://domainlanguage.com/ddd/)
- [Feature-Driven Development](https://en.wikipedia.org/wiki/Feature-driven_development)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [TypeScript Best Practices](https://typescript-eslint.io/docs/)