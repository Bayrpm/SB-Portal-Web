import { Email } from '../value-objects/Email';
import { UserId } from '../value-objects/UserId';

export class User {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(email: Email, name: string): User {
    return new User(
      UserId.generate(),
      email,
      name,
      new Date(),
      new Date()
    );
  }

  updateName(name: string): User {
    return new User(
      this.id,
      this.email,
      name,
      this.createdAt,
      new Date()
    );
  }

  isActive(): boolean {
    // Business logic example
    return true;
  }
}