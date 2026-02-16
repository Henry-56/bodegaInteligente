import { vi } from "vitest";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    inventory: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    purchase: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    purchaseItem: {
      create: vi.fn(),
    },
    sale: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    saleItem: {
      create: vi.fn(),
    },
    debtor: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    debt: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    debtPayment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    chatEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn({
      product: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      inventory: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      purchase: {
        create: vi.fn(),
        update: vi.fn(),
      },
      purchaseItem: {
        create: vi.fn(),
      },
      sale: {
        create: vi.fn(),
      },
      debt: {
        update: vi.fn(),
      },
      debtPayment: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    })),
  },
}));
