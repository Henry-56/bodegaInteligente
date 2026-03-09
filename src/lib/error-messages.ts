export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "No tienes permiso para acceder a este recurso. Por favor, inicia sesión.",
  WAREHOUSE_NOT_LINKED: "No tienes un almacén vinculado a tu cuenta. Por favor, contacta al administrador.",
  VALIDATION_ERROR: "Los datos proporcionados no son válidos.",
  INTERNAL_ERROR: "Ocurrió un error interno en el servidor.",
  DUPLICATE_ENTRY: "Ya existe un registro con estos datos.",
};

export function getErrorMessage(code: string | null | undefined): string {
  if (!code) return "Ocurrió un error inesperado.";
  return ERROR_MESSAGES[code] || `Error: ${code}`;
}
