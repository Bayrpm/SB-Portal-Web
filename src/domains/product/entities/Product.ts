import { ProductId } from '../value-objects/ProductId';
import { Money } from '../value-objects/Money';

export class Product {
  constructor(
    public readonly id: ProductId,
    public readonly name: string,
    public readonly description: string,
    public readonly price: Money,
    public readonly stock: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(name: string, description: string, price: Money, stock: number): Product {
    return new Product(
      ProductId.generate(),
      name,
      description,
      price,
      stock,
      true,
      new Date(),
      new Date()
    );
  }

  updatePrice(newPrice: Money): Product {
    return new Product(
      this.id,
      this.name,
      this.description,
      newPrice,
      this.stock,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  isAvailable(): boolean {
    return this.isActive && this.stock > 0;
  }
}