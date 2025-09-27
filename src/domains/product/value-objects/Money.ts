export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string = 'USD'
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!this.isValidCurrency(currency)) {
      throw new Error('Invalid currency code');
    }
  }

  static fromAmount(amount: number, currency: string = 'USD'): Money {
    return new Money(amount, currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }

  private isValidCurrency(currency: string): boolean {
    // Simple validation for common currencies
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    return validCurrencies.includes(currency);
  }
}