import { User } from '../entities/User';
import { Email } from '../value-objects/Email';
import { UserRepository } from '../repositories/UserRepository';

export class UserDomainService {
  constructor(private userRepository: UserRepository) {}

  async isEmailUnique(email: Email): Promise<boolean> {
    const existingUser = await this.userRepository.findByEmail(email);
    return existingUser === null;
  }

  async canUserBeDeleted(user: User): Promise<boolean> {
    // Business logic to determine if user can be deleted
    // For example, check if user has pending orders, etc.
    return user.isActive();
  }
}