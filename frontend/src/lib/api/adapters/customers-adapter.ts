import type { Customer, CreateCustomerInput, UpdateCustomerInput } from "@/types/domain/customer";
import { mockCustomers } from "@/data/mock/customers";

/**
 * Adapter boundary for the Customer entity. Originally (Part 5) just
 * enough to populate a customer picker in `ContractForm` — `create`/
 * `update` added in the Customer Module pass (this pass), mirroring
 * `VendorsAdapter`'s pattern, so the new `/admin/customers` screens have
 * a real create/edit path rather than reaching into `mockCustomers`
 * directly.
 *
 * Backend contract — see docs/API_CONTRACTS.md:
 *   GET    /api/customers          — list
 *   GET    /api/customers/:id      — detail
 *   POST   /api/customers          — create (customers:write)
 *   PATCH  /api/customers/:id      — edit (customers:write)
 */
export interface CustomerActor {
  id: string;
  name: string;
}

export interface CustomersAdapter {
  list(): Promise<Customer[]>;
  get(id: string): Promise<Customer | null>;
  create(input: CreateCustomerInput, actor: CustomerActor): Promise<Customer>;
  update(id: string, patch: UpdateCustomerInput, actor: CustomerActor): Promise<Customer>;
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

  async create(input: CreateCustomerInput, _actor: CustomerActor): Promise<Customer> {
    await delay(450);
    const now = new Date().toISOString();
    const customer: Customer = {
      id: `cust_${Math.random().toString(36).slice(2, 10)}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      alternatePhone: input.alternatePhone,
      address: input.address,
      notes: input.notes,
      leadId: input.leadId,
      createdAt: now,
      updatedAt: now,
    };
    this.customers = [customer, ...this.customers];
    return customer;
  }

  async update(id: string, patch: UpdateCustomerInput, _actor: CustomerActor): Promise<Customer> {
    await delay(350);
    const customer = this.mustFind(id);
    const updated: Customer = { ...customer, ...patch, updatedAt: new Date().toISOString() };
    this.replace(updated);
    return updated;
  }

  private mustFind(id: string): Customer {
    const customer = this.customers.find((c) => c.id === id);
    if (!customer) throw new Error("Customer not found.");
    return customer;
  }

  private replace(updated: Customer) {
    this.customers = this.customers.map((c) => (c.id === updated.id ? updated : c));
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const customersAdapter: CustomersAdapter = new MockCustomersAdapter();
