import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';

export class UserCreatedEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly name: string
  ) {
    this.occurredOn = new Date();
  }
}