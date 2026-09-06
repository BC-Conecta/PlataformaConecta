const messages: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha inválidos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User not found": "Usuário não encontrado.",
  "Too many requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "Email rate limit exceeded": "Limite de envio de e-mails atingido. Aguarde e tente novamente.",
  "JWT issued at future": "A sessão ficou inválida porque o relógio do computador está adiantado. Sincronize a data e a hora e entre novamente.",
};

export function translateKnownAuthError(message?: string): string {
  const normalized = message?.trim() || "";
  return messages[normalized] || normalized;
}

export function getAuthErrorMessage(error: { message?: string }): string {
  return translateKnownAuthError(error.message) || "Não foi possível entrar. Verifique seus dados e tente novamente.";
}
