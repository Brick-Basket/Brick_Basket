import { describe, expect, it } from "vitest";
import { contractsAdapter } from "./contracts-adapter";

const ADMIN = { id: "u_test_admin", name: "Test Admin" };
const CUSTOMER = { id: "u_test_customer", name: "Test Customer" };

describe("contractsAdapter — send → accept/decline workflow", () => {
  it("walks a draft contract through send-for-acceptance to accepted", async () => {
    const contract = await contractsAdapter.create(
      {
        title: "Test Contract — Foundation",
        customerId: "cust_arjun_kapoor",
        lineItems: [{ category: "civil", description: "Foundation work", uom: "sqft", quantity: 100, rate: 500 }],
      },
      ADMIN,
    );
    expect(contract.status).toBe("draft");

    const sent = await contractsAdapter.sendForAcceptance(contract.id, ADMIN);
    expect(sent.status).toBe("sent_for_acceptance");
    expect(sent.sentAt).not.toBeNull();

    const accepted = await contractsAdapter.respond(contract.id, "accepted", CUSTOMER);
    expect(accepted.status).toBe("accepted");
    expect(accepted.respondedAt).not.toBeNull();
    expect(accepted.declineReason).toBeNull();
  });

  it("records a decline reason, and refuses a second response once already declined", async () => {
    const contract = await contractsAdapter.create(
      {
        title: "Test Contract — Roofing",
        customerId: "cust_arjun_kapoor",
        lineItems: [{ category: "civil", description: "Roofing", uom: "sqft", quantity: 50, rate: 300 }],
      },
      ADMIN,
    );
    await contractsAdapter.sendForAcceptance(contract.id, ADMIN);

    const declined = await contractsAdapter.respond(contract.id, "declined", CUSTOMER, "Price too high");
    expect(declined.status).toBe("declined");
    expect(declined.declineReason).toBe("Price too high");

    await expect(contractsAdapter.respond(contract.id, "accepted", CUSTOMER)).rejects.toThrow();
  });

  it("lets a declined contract be revised back to draft, and refuses sending a contract that isn't in draft", async () => {
    const contract = await contractsAdapter.create(
      {
        title: "Test Contract — Painting",
        customerId: "cust_arjun_kapoor",
        lineItems: [{ category: "finishing", description: "Painting", uom: "sqft", quantity: 20, rate: 100 }],
      },
      ADMIN,
    );
    await contractsAdapter.sendForAcceptance(contract.id, ADMIN);
    await contractsAdapter.respond(contract.id, "declined", CUSTOMER, "Not now");

    const revised = await contractsAdapter.update(contract.id, { notes: "Revised after decline" }, ADMIN);
    expect(revised.status).toBe("draft");
    expect(revised.declineReason).toBeNull();

    await contractsAdapter.sendForAcceptance(contract.id, ADMIN);
    await expect(contractsAdapter.sendForAcceptance(contract.id, ADMIN)).rejects.toThrow();
  });
});
