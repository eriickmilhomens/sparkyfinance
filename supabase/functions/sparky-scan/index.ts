import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("Nenhuma imagem recebida");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `Você é um especialista em OCR de notas fiscais e comprovantes brasileiros. Analise a imagem e extraia as informações financeiras.

REGRAS:
- Retorne SOMENTE via tool call, sem texto adicional
- Identifique: valor total, data, nome do estabelecimento, categoria e se é receita ou despesa
- Datas no formato DD/MM/AAAA
- Valores como números positivos (sem R$)
- Se não conseguir ler algum campo, use "Não identificado" para texto e 0 para valores
- Categorias: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Receita, Transferência, Cartão, Outros
- type: "in" para receita/crédito, "out" para débito/despesa
- confidence: número de 0 a 1 indicando confiança na leitura geral`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise esta nota fiscal/comprovante e extraia as informações financeiras:" },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt",
              description: "Extract financial data from a receipt or invoice image",
              parameters: {
                type: "object",
                properties: {
                  establishment: { type: "string", description: "Nome do estabelecimento" },
                  date: { type: "string", description: "Data no formato DD/MM/AAAA" },
                  total: { type: "number", description: "Valor total" },
                  category: { type: "string", enum: ["Alimentação", "Transporte", "Moradia", "Saúde", "Lazer", "Educação", "Receita", "Transferência", "Cartão", "Outros"] },
                  type: { type: "string", enum: ["in", "out"] },
                  confidence: { type: "number", description: "Confiança na leitura (0-1)" },
                  items: {
                    type: "array",
                    description: "Itens individuais identificados (opcional)",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        value: { type: "number" }
                      },
                      required: ["name", "value"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["establishment", "date", "total", "category", "type", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Erro no processamento da imagem");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("IA não retornou dados estruturados");
  } catch (e) {
    console.error("scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro ao escanear" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
