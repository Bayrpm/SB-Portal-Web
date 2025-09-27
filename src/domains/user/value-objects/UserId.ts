import { v4 as uuidv4 } from 'uuid';

export class UserId {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid UserId format');
    }
  }

  static generate(): UserId {
    return new UserId(uuidv4());
  }

  static fromString(value: string): UserId {
    return new UserId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  private isValid(value: string): boolean {
    // UUID v4 validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}