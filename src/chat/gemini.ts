// ── ReAct Agent con @google/genai SDK oficial ─────────────────
// Implementa el patrón ReAct: Razona → Actúa (tool) → Observa → Repite
// Usa function calling con schemas estructurados para cada herramienta.

import {
  GoogleGenAI,
  FunctionCallingConfigMode,
  createPartFromFunctionResponse,
  type FunctionDeclaration,
  type Part,
} from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_REACT_STEPS = 5;

// ── System Prompt (ReAct) ──────────────────────────────────────

const SYSTEM_PROMPT = `Eres el asistente inteligente de un sistema de gestión de bodegas (tiendas pequeñas) en Perú.

Sigue el patrón ReAct (Razona → Actúa → Observa):
1. Analiza qué quiere el usuario
2. Usa las herramientas necesarias para ejecutar la acción
3. Observa el resultado y decide si necesitas otra herramienta
4. Cuando termines, responde al usuario con un resumen claro

IMPORTANTE — Distingue VENTA vs COMPRA:
- registrar_venta = el bodeguero VENDIÓ productos a un cliente (sale reducen stock)
  Palabras clave: "vendí", "venta", "me compraron", "le vendí"
- registrar_compra = el bodeguero COMPRÓ/RECIBIÓ mercadería de un proveedor (ingreso aumenta stock)
  Palabras clave: "compré", "añadir", "agregar", "ingresar", "llegó mercadería", "boleta", "factura"
- Si el usuario sube una imagen de boleta/factura → SIEMPRE es registrar_compra (ingreso de mercadería)
- Una "boleta de venta" de un proveedor = COMPRA para la bodega

Reglas generales:
- Montos en Soles (S/)
- Sé flexible con errores de ortografía y variaciones del español peruano
- "fío", "fiar", "fiado", "me debe", "le fié" → usa registrar_deuda para CREAR una deuda nueva
- "pagó", "abonó" → usa registrar_pago_deuda para registrar un PAGO de deuda existente
- Puedes encadenar herramientas si el usuario pide varias cosas
- Responde siempre en español, de forma breve y amigable
- Si no entiendes, sugiere ejemplos: "vendí 5 galletas a 2.50", "stock de arroz", "ganancia hoy", "Juan pagó 10"`;

// ── Tool Declarations (schemas estructurados) ──────────────────

const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "registrar_venta",
    description:
      "Registra una VENTA (salida de productos al cliente). Usa SOLO cuando el usuario diga que VENDIÓ algo. NO uses para agregar/ingresar productos al inventario.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        products: {
          type: "array",
          description: "Lista de productos vendidos",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Nombre del producto vendido",
              },
              qty: {
                type: "number",
                description: "Cantidad vendida",
              },
              unitPrice: {
                type: "number",
                description:
                  "Precio unitario en soles. Omitir si el usuario no lo mencionó.",
              },
            },
            required: ["name", "qty"],
          },
        },
      },
      required: ["products"],
    },
  },
  {
    name: "consultar_stock",
    description:
      "Consulta el stock/inventario de un producto específico en la bodega.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        productName: {
          type: "string",
          description: "Nombre del producto a consultar",
        },
      },
      required: ["productName"],
    },
  },
  {
    name: "consultar_ganancia",
    description:
      "Consulta la ganancia/utilidad acumulada de un período de tiempo.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["today", "week", "month"],
          description:
            "Período: today=hoy/del día, week=esta semana, month=este mes",
        },
      },
      required: ["period"],
    },
  },
  {
    name: "registrar_deuda",
    description:
      "Registra una nueva DEUDA (fiado/crédito). Usa cuando el usuario dice que alguien le debe, que fió productos, o que un cliente se llevó algo fiado. Ejemplo: 'Juan me debe 50', 'le fié 20 a María', 'Pedro se llevó fiado 30 soles de arroz'.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        debtorName: {
          type: "string",
          description: "Nombre del cliente que tiene la deuda",
        },
        amount: {
          type: "number",
          description: "Monto de la deuda en soles",
        },
        note: {
          type: "string",
          description:
            "Nota opcional describiendo qué se llevó fiado (ej: 'pan y leche')",
        },
      },
      required: ["debtorName", "amount"],
    },
  },
  {
    name: "registrar_pago_deuda",
    description:
      "Registra el pago (abono) de una deuda existente de un cliente. Usa cuando el usuario dice que alguien pagó o abonó.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        debtorName: {
          type: "string",
          description: "Nombre del deudor",
        },
        amount: {
          type: "number",
          description: "Monto del pago en soles",
        },
      },
      required: ["debtorName", "amount"],
    },
  },
  {
    name: "registrar_compra",
    description:
      "Registra una COMPRA/INGRESO de mercadería a la bodega (aumenta el stock). Usa cuando: el usuario sube una imagen de boleta/factura, dice que compró productos, quiere añadir/agregar/ingresar productos al inventario, o recibió mercadería. SIEMPRE usa esta herramienta cuando haya una imagen de boleta.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        vendorName: {
          type: "string",
          description:
            "Nombre del proveedor (si se ve en la boleta o lo menciona el usuario)",
        },
        items: {
          type: "array",
          description: "Lista de productos comprados con cantidad y costo",
          items: {
            type: "object",
            properties: {
              productName: {
                type: "string",
                description: "Nombre del producto comprado",
              },
              qty: {
                type: "integer",
                description: "Cantidad comprada",
              },
              unitCost: {
                type: "number",
                description: "Costo unitario en soles",
              },
            },
            required: ["productName", "qty", "unitCost"],
          },
        },
      },
      required: ["items"],
    },
  },
];

// ── Types ──────────────────────────────────────────────────────

export type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<{ response: string; success: boolean; data?: unknown }>;

export interface ImageInput {
  base64: string;
  mimeType: string;
}

export interface AgentResult {
  response: string;
  success: boolean;
  data?: unknown;
  toolsUsed: Array<{ tool: string; args: unknown; result: unknown }>;
}

// ── ReAct Loop (usa Chat API del SDK) ──────────────────────────

export async function callGeminiReact(
  userMessage: string,
  toolHandlers: Record<string, ToolHandler>,
  image?: ImageInput,
): Promise<AgentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { response: "", success: false, toolsUsed: [] };
  }

  const ai = new GoogleGenAI({ apiKey });

  const chat = ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
      toolConfig: {
        functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
      },
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  });

  const toolsUsed: AgentResult["toolsUsed"] = [];
  let lastToolResult:
    | { response: string; success: boolean; data?: unknown }
    | undefined;

  try {
    // Build the first message — text + optional image
    const firstMessage: (string | Part)[] = [userMessage];
    if (image) {
      firstMessage.push({
        inlineData: { data: image.base64, mimeType: image.mimeType },
      });
    }

    let response = await chat.sendMessage({ message: firstMessage });

    for (let step = 0; step < MAX_REACT_STEPS; step++) {
      const functionCalls = response.functionCalls;

      // No function calls → final text response (end of ReAct loop)
      if (!functionCalls || functionCalls.length === 0) {
        return {
          response: response.text || lastToolResult?.response || "Listo.",
          success: lastToolResult?.success ?? true,
          data: lastToolResult?.data,
          toolsUsed,
        };
      }

      // Execute each function call (tool invocation)
      const responseParts: Part[] = [];

      for (const fc of functionCalls) {
        const name = fc.name!;
        const args = fc.args ?? {};
        const handler = toolHandlers[name];

        let result: { response: string; success: boolean; data?: unknown };

        if (handler) {
          try {
            result = await handler(args);
          } catch (err) {
            result = {
              response: `Error ejecutando ${name}: ${err instanceof Error ? err.message : String(err)}`,
              success: false,
            };
          }
        } else {
          result = {
            response: `Herramienta "${name}" no disponible.`,
            success: false,
          };
        }

        lastToolResult = result;
        toolsUsed.push({ tool: name, args, result });

        // Send structured result back to the model (observation step)
        responseParts.push(
          createPartFromFunctionResponse(fc.id ?? name, name, {
            output: result.response,
            success: result.success,
            data: result.data ?? null,
          }),
        );
      }

      // Send all function results back to Gemini
      response = await chat.sendMessage({ message: responseParts });
    }

    // Max steps reached
    return {
      response:
        lastToolResult?.response ??
        "Se alcanzó el límite de pasos. Intenta un comando más simple.",
      success: lastToolResult?.success ?? false,
      data: lastToolResult?.data,
      toolsUsed,
    };
  } catch (error) {
    console.error("Gemini ReAct error:", error);
    return { response: "", success: false, toolsUsed };
  }
}

// ── Mapeo tool → intent (para ChatEvent audit log) ─────────────

export const TOOL_TO_INTENT: Record<string, string> = {
  registrar_venta: "SALE",
  consultar_stock: "STOCK_QUERY",
  consultar_ganancia: "PROFIT_QUERY",
  registrar_deuda: "DEBT_REGISTER",
  registrar_pago_deuda: "DEBT_PAYMENT",
  registrar_compra: "PURCHASE",
};
