import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(code);
    this.name = "AppError";
  }
}

interface SessionData {
  userId: string;
  role: "OWNER" | "STAFF";
  warehouseId: string;
  email: string;
}

type HandlerFn = (
  req: Request,
  ctx: { params?: any; session: SessionData }
) => Promise<NextResponse>;

export function withAuth(handler: HandlerFn) {
  return async (req: Request, ctx?: { params?: any }) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.warehouseId) {
        return NextResponse.json(
          { error: "UNAUTHORIZED" },
          { status: 401 }
        );
      }

      const sessionData: SessionData = {
        userId: session.user.userId,
        role: session.user.role,
        warehouseId: session.user.warehouseId,
        email: session.user.email ?? "",
      };

      return await handler(req, {
        params: ctx?.params,
        session: sessionData,
      });
    } catch (error) {
      return handleError(error);
    }
  };
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.code, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Prisma unique constraint
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code === "P2002"
  ) {
    return NextResponse.json(
      {
        error: "DUPLICATE_ENTRY",
        details: { fields: (error as any).meta?.target },
      },
      { status: 409 }
    );
  }

  console.error("Unhandled error:", error);
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}
