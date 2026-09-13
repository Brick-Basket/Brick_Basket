import type { Customer } from "@/types/domain/customer";
import { mockCustomers } from "@/data/mock/customers";

/**
 * Adapter boundary for the (currently minimal) Customer entity — enough to
 * populate a customer picker in `ContractForm` (Part 5) without any
 * component reaching into `data/mock/customers.ts` directly. Extend this
 * file, don't duplicate it, when a real Customer module gets its own part.
 */
export interface CustomersAdapter {
  list(): Promise<Customer[]>;
  get(id: string): Promise<Customer | null>;
}

class MockCustomersAdapter implements CustomersAdapter {
  private customers: Customer[] = [...mockCustomers];

  async list(): Promise<Customer[]> {
    await delay(200);
    return [...this.customers];
  }

  async get(id: string): Promise<Customer | null> {
    await delay(150);
    return this.customers.find((c) => c.id === id) ?? null;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const customersAdapter: CustomersAdapter = new MockCustomersAdapter();
