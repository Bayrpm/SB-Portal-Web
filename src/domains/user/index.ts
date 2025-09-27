// User domain exports
export { User } from './entities/User';
export { UserId } from './value-objects/UserId';
export { Email } from './value-objects/Email';
export type { UserRepository } from './repositories/UserRepository';
export { UserDomainService } from './services/UserDomainService';
export { UserCreatedEvent } from './events/UserCreatedEvent';