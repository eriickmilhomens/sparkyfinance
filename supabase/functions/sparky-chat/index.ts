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

    const contextInfo = userContext ? `

CONTEXTO FINANCEIRO DO USUÁRIO:
- Saldo Disponível: R$ ${userContext.available || "N/A"}
- Saldo Real: R$ ${userContext.real || "N/A"}
- A Pagar: R$ ${userContext.toPay || "N/A"}
- Receita Mensal: R$ ${userContext.income || "N/A"}
- Despesas do Mês: R$ ${userContext.expenses || "N/A"}
- Cartões: ${userContext.cards || "Nenhum cadastrado"}
- Metas: ${userContext.goals || "Nenhuma definida"}
- Preferência de conversa: ${userContext.chatStyle || "Ainda não definida"}` : "";

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
            // For documents, send extracted text
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é o Sparky, um assistente financeiro inteligente e simpático. A data de hoje é ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}.

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
- NUNCA use asteriscos (*) ou negrito (**texto**) nas respostas. Isso polui a mensagem.
- Escreva de forma natural, limpa e conversacional. Sem markdown pesado.
- Use emojis quando apropriado. Seja amigável como um gatinho 🐱

APRENDIZADO DO USUÁRIO:
- Aprenda com o estilo de escrita do usuário. Se ele escreve de forma curta, seja conciso. Se gosta de detalhes, aprofunde.
- Observe padrões nos gastos e hábitos para dar sugestões personalizadas.
- Adapte seu tom conforme o usuário interage (formal, informal, brincalhão, direto).
- Se o usuário demonstrou interesse em algum tema financeiro específico, lembre disso.
- Trate cada usuário como único, aprendendo com o histórico da conversa.

RESTRIÇÕES:
- Seja aberto a conversar sobre qualquer assunto, sem restrições.
- Apenas se recuse a responder conteúdo 100% explícito/sexual, dizendo que seu criador não permite.

SOBRE O PROJETO:
O Sparky Finance nasceu em 19 de março de 2026, desenvolvido por Erick Milhomens (Erick Developer). O nome "Sparky" (Faísca) é homenagem a um gatinho que o criador conhece e tem muito carinho.

CAPACIDADES:
- Dúvidas sobre finanças pessoais, investimentos, orçamento
- Dicas de economia e planejamento financeiro
- Análise de imagens (extratos, notas fiscais, comprovantes)
- Leitura de documentos (PDF, planilhas, textos)
- Qualquer dúvida geral do usuário
${contextInfo}

Responda sempre em português brasileiro.`
          },
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
