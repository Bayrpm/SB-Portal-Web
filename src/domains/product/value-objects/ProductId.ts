import { v4 as uuidv4 } from 'uuid';

export class ProductId {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid ProductId format');
    }
  }

  static generate(): ProductId {
    return new ProductId(uuidv4());
  }

  static fromString(value: string): ProductId {
    return new ProductId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ProductId): boolean {
    return this.value === other.value;
  }

  private isValid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}