import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");
    if (!url || !anonKey || !serviceRoleKey) return response({ error: "Configuração do Supabase incompleta." }, 500);
    if (!authorization) return response({ error: "Usuário não autenticado." }, 401);

    const auth = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await auth.auth.getUser();
    if (authError || !authData.user?.email) return response({ error: "Usuário não autenticado." }, 401);

    const admin = createClient(url, serviceRoleKey);
    const email = authData.user.email.trim().toLowerCase();
    const { data: requesters, error: requesterError } = await auth
      .from("people")
      .select("id,type,email,active");
    const requester = (requesters || []).find((person) =>
      person.active === true &&
      ["ADMINISTRADOR", "GESTOR"].includes(String(person.type).toUpperCase()) &&
      String(person.email || "").toLowerCase() === email,
    );
    if (requesterError) {
      return response({ error: `Não foi possível consultar os administradores: ${requesterError.message}` }, 500);
    }
    if (!requester) return response({ error: `Apenas administradores ou gestores podem criar acessos. Sessão: ${email}; registros consultados: ${(requesters || []).length}.` }, 403);

    const body = await request.json();
    const role = String(body.role || "");
    const targetEmail = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const personId = String(body.personId || "");
    if (!personId || !name || !targetEmail || !["GESTOR", "PROFESSOR"].includes(role)) {
      return response({ error: "Acesso disponível apenas para gestores e professores com dados completos." }, 400);
    }

    const { data: person } = await auth
      .from("people")
      .select("id,email,type")
      .eq("id", personId)
      .maybeSingle();
    if (!person || person.type !== role || person.email.trim().toLowerCase() !== targetEmail) {
      return response({ error: "A pessoa informada não corresponde ao cadastro salvo." }, 400);
    }

    const { data: invitation, error: invitationError } = await admin.auth.admin.inviteUserByEmail(targetEmail, {
      data: { name, role, personId },
    });
    if (invitationError) throw invitationError;
    const { error: profileError } = await admin
      .from("user_profiles")
      .update({ person_id: personId })
      .eq("id", invitation.user.id);
    if (profileError) throw profileError;
    return response({ invited: true });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Não foi possível criar o acesso." }, 500);
  }
});