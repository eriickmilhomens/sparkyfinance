import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    const contextBlock = userContext ? `
PAINEL FINANCEIRO EM TEMPO REAL:
┌─────────────────────────────────────┐
│ Saldo Real:        R$ ${(userContext.real ?? 0).toFixed(2).padStart(10)}  │
│ A Pagar:           R$ ${(userContext.toPay ?? 0).toFixed(2).padStart(10)}  │
│ Saldo Disponível:  R$ ${(userContext.available ?? 0).toFixed(2).padStart(10)}  │
│ Receita do Mês:    R$ ${(userContext.income ?? 0).toFixed(2).padStart(10)}  │
│ Despesas do Mês:   R$ ${(userContext.expenses ?? 0).toFixed(2).padStart(10)}  │
│ Pode Gastar Hoje:  R$ ${(userContext.dailyBudget ?? 0).toFixed(2).padStart(10)}  │
│ Dias Restantes:    ${String(userContext.daysLeft ?? 0).padStart(13)}  │
└─────────────────────────────────────┘

CARTÕES DE CRÉDITO: ${userContext.cards || "Nenhum cadastrado"}
METAS DE INVESTIMENTO: ${userContext.goals || "Nenhuma definida"}

CONTAS A VENCER: ${userContext.upcomingBills || "Nenhuma pendente"}

MAIORES CATEGORIAS DE GASTO (mês atual):
${userContext.topCategories || "Sem dados"}

ÚLTIMAS TRANSAÇÕES:
${userContext.recentTransactions || "Nenhuma"}

PREFERÊNCIA DE CONVERSA: ${userContext.chatStyle || "Ainda não definida"}` : "\n[Dados financeiros indisponíveis no momento]";

    // Transform messages: if any message has images/files, format for multimodal
    const formattedMessages = messages.map((msg: any) => {
      if (msg.role === "user" && msg.attachments && msg.attachments.length > 0) {
        const content: any[] = [];
        if (msg.content) {
          content.push({ type: "text", text: msg.content });
        }
        for (const att of msg.attachments) {
          if (att.type === "image") {
            content.push({
              type: "image_url",
              image_url: { url: att.data },
            });
          } else if (att.type === "document") {
            content.push({
              type: "text",
              text: `[Documento anexado: ${att.name}]\n\n${att.extractedText || "Conteúdo não disponível para leitura."}`,
            });
          }
        }
        return { role: msg.role, content };
      }
      return { role: msg.role, content: msg.content };
    });

    const systemPrompt = `Você é o Sparky, um analista financeiro pessoal e assistente geral. Tem acesso direto aos dados financeiros do usuário em tempo real.

Data de hoje: ${today} (dia ${dayOfMonth} de ${daysInMonth}).

${contextBlock}

COMPORTAMENTO:
- Seja direto e objetivo. Máximo 2-3 parágrafos por resposta, a menos que peçam detalhes.
- Se houver alerta urgente (saldo negativo, conta vencendo), mencione logo na primeira frase.
- Adapte o tom ao estilo do usuário: se escreve curto, seja conciso.
- Você é versátil: responda sobre qualquer assunto livremente, não apenas finanças. Se o usuário mudar de assunto, acompanhe naturalmente.
- Quando falar de finanças, use dados reais do painel acima. Nunca invente números.

FORMATAÇÃO:
- Responda sempre em texto puro e limpo.
- NUNCA use HTML (<strong>, <b>, <i>, etc.).
- NUNCA use markdown com asteriscos (* ou **).
- Para listas, use hífens (-) ou numeração direta (1. 2. 3.).
- Evite travessões excessivos na estrutura das respostas.
- Use emojis com moderação quando apropriado.
- Valores monetários no formato: R$ X.XXX,XX

SOBRE VOCÊ:
- Seu nome é Sparky ("Faísca"), homenagem ao gatinho Faísca.
- Sparky Finance nasceu em 19 de março de 2026, criado por Erick Milhomens (Erick Developer).

RESTRIÇÕES:
- Nunca peça senhas ou dados sensíveis.
- Nunca invente dados financeiros.
- Evite conteúdo explícito/sexual.

Responda sempre em português brasileiro.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...formattedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
