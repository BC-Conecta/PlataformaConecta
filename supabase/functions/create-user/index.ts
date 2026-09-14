import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Configuração do Supabase incompleta." }, 500);

    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Usuário não autenticado." }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Usuário não autenticado." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: requester, error: requesterError } = await admin
      .from("user_profiles")
      .select("role,email,person_id")
      .eq("id", authData.user.id)
      .maybeSingle();
    let requesterRole = String(requester?.role || "").toUpperCase();
    const requesterQueryError = requesterError?.message || null;
    const requesterEmails = [...new Set([
      authData.user.email,
      requester?.email,
    ].filter(Boolean).map((email) => String(email).trim().toLowerCase()))];
    let requesterPerson: { id: string; type: "ADMINISTRADOR" | "GESTOR" } | null = null;
    let requesterPersonQueryError: string | null = null;
    for (const requesterEmail of requesterEmails) {
      const { data, error } = await admin
        .from("people")
        .select("id,type,active")
        .eq("active", true)
        .ilike("email", requesterEmail)
        .in("type", ["ADMINISTRADOR", "GESTOR"])
        .maybeSingle();
      requesterPersonQueryError = error?.message || requesterPersonQueryError;
      if (data) {
        requesterPerson = data as { id: string; type: "ADMINISTRADOR" | "GESTOR" };
        break;
      }
    }
    if (requesterPerson) {
      requesterRole = requesterPerson.type;
      if (requester?.role !== requesterPerson.type || requester?.person_id !== requesterPerson.id) {
        await admin
          .from("user_profiles")
          .update({ role: requesterPerson.type, person_id: requesterPerson.id, active: true })
          .eq("id", authData.user.id);
      }
    }
    console.log("create-user authorization", {
      project: supabaseUrl,
      authUserId: authData.user.id,
      authEmail: authData.user.email,
      profileRole: requester?.role,
      matchedPersonId: requesterPerson?.id,
      matchedPersonType: requesterPerson?.type,
          requesterQueryError,
          requesterPersonQueryError,
    });
    if (!requesterPerson && !["ADMINISTRADOR", "GESTOR"].includes(requesterRole)) {
      return json({
        error: "Apenas administradores ou gestores podem criar acessos.",
        diagnostic: {
          authEmail: authData.user.email,
          profileRole: requester?.role || null,
          matchedPerson: Boolean(requesterPerson),
          requesterQueryError,
          requesterPersonQueryError,
        },
      }, 403);
    }

    const body = await request.json();
    const role = body.role as string;
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const personId = String(body.personId || "");
    if (!personId || !name || !email || !["GESTOR", "PROFESSOR"].includes(role)) {
      return json({ error: "Acesso disponível apenas para gestores e professores com dados completos." }, 400);
    }

    const { data: person, error: personError } = await admin
      .from("people")
      .select("id,email,type")
      .eq("id", personId)
      .maybeSingle();
    if (personError || !person || person.type !== role || person.email.toLowerCase() !== email) {
      return json({ error: "A pessoa informada não corresponde ao cadastro salvo." }, 400);
    }

    const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) throw usersError;
    const existing = users.users.find((user) => user.email?.toLowerCase() === email);
    if (existing) {
      const { data: profile } = await admin.from("user_profiles").select("role,person_id").eq("id", existing.id).maybeSingle();
      if (profile?.person_id && profile.person_id !== personId) {
        return json({ error: "Este e-mail já está vinculado a outra pessoa." }, 409);
      }
      if (profile?.role !== role) {
        return json({ error: `Este e-mail já possui um usuário com o perfil ${profile?.role || "diferente"}. Use outro e-mail.` }, 409);
      }
      await admin.from("user_profiles").update({ person_id: personId, name, email }).eq("id", existing.id);
      return json({ invited: false });
    }

    const { data: invitation, error: invitationError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { name, role },
    });
    if (invitationError) throw invitationError;
    const { error: profileError } = await admin
      .from("user_profiles")
      .update({ person_id: personId })
      .eq("id", invitation.user.id);
    if (profileError) throw profileError;
    return json({ invited: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Não foi possível criar o acesso." }, 500);
  }
});