import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Plus, Trash2, ChevronLeft, MoreVertical, Paperclip, Image, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Attachment = {
  type: "image" | "document";
  name: string;
  data: string; // base64 data URI for images
  extractedText?: string; // for documents
  preview?: string; // thumbnail/icon
};

type Msg = { role: "user" | "assistant"; content: string; attachments?: Attachment[] };
type Conversation = { id: string; title: string; summary: string; messages: Msg[]; createdAt: string; lastActiveAt: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sparky-chat`;
const BASE_STORAGE_KEY = "sparky-chat-history";
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const getStorageKey = (): string => {
  const isDemo = localStorage.getItem("sparky-demo-mode") === "true";
  if (isDemo) return `${BASE_STORAGE_KEY}-demo`;
  // User-specific key will be set once we have the user id
  const userId = localStorage.getItem("sparky-current-user-id");
  return userId ? `${BASE_STORAGE_KEY}-${userId}` : BASE_STORAGE_KEY;
};

const loadConversations = (): Conversation[] => {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey()) || "[]").map((c: any) => ({
      ...c,
      summary: c.summary || "",
    }));
  } catch { return []; }
};

const saveConversations = (convs: Conversation[]) => {
  localStorage.setItem(getStorageKey(), JSON.stringify(convs));
};

const generateTitle = (msgs: Msg[]): string => {
  const firstUser = msgs.find(m => m.role === "user");
  if (!firstUser) return "Nova conversa";
  const text = firstUser.content.trim();
  let sentence = text.split(/[!?\n]/)[0].trim();
  if (sentence.length > 45) sentence = sentence.slice(0, 42) + "...";
  if (!sentence) {
    if (firstUser.attachments?.length) return "Arquivo enviado.";
    return "Nova conversa";
  }
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  if (!sentence.endsWith(".") && !sentence.endsWith("...")) sentence += ".";
  return sentence;
};

const generateSummary = (msgs: Msg[]): string => {
  if (msgs.length === 0) return "";
  const userMsgs = msgs.filter(m => m.role === "user");
  if (userMsgs.length === 0) return "";
  const first = userMsgs[0].content.trim().slice(0, 60) || "Arquivo enviado";
  let summary = first.charAt(0).toUpperCase() + first.slice(1);
  if (userMsgs.length > 1) summary += ` (+${userMsgs.length - 1} mensagens)`;
  if (!summary.endsWith(".")) summary += ".";
  if (summary.length > 80) summary = summary.slice(0, 77) + "...";
  return summary;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const DOC_TYPES = ["application/pdf", "text/plain", "text/csv", "text/xml", "application/xml",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json"];

const ChatView = () => {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Set current user ID for scoped chat storage
  useEffect(() => {
    const isDemo = localStorage.getItem("sparky-demo-mode") === "true";
    if (isDemo) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        localStorage.setItem("sparky-current-user-id", session.user.id);
        // Reload conversations for this user
        setConversations(loadConversations());
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    setConversations(prev => {
      const exists = prev.find(c => c.id === activeId);
      let updated;
      if (exists) {
        updated = prev.map(c =>
          c.id === activeId ? { ...c, messages, title: generateTitle(messages), summary: generateSummary(messages), lastActiveAt: new Date().toISOString() } : c
        );
      } else {
        const now = new Date().toISOString();
        const conv: Conversation = { id: activeId, title: generateTitle(messages), summary: generateSummary(messages), messages, createdAt: now, lastActiveAt: now };
        updated = [conv, ...prev];
      }
      saveConversations(updated);
      return updated;
    });
  }, [messages, activeId]);

  const startNewChat = useCallback(() => {
    const id = crypto.randomUUID();
    setActiveId(id);
    setMessages([]);
    setPendingAttachments([]);
    setShowHistory(false);
    setShowNewChatConfirm(false);
  }, []);

  const handleNewChatClick = () => {
    if (messages.length > 0) {
      setShowNewChatConfirm(true);
    } else {
      startNewChat();
    }
  };

  const openConversation = (conv: Conversation) => {
    setActiveId(conv.id);
    setMessages(conv.messages);
    setShowHistory(false);
  };

  const deleteConversation = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveConversations(updated);
      return updated;
    });
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const deleteAll = () => {
    setConversations([]);
    saveConversations([]);
    setActiveId(null);
    setMessages([]);
    setShowMenu(false);
  };

  useEffect(() => {
    if (!activeId) {
      const convs = loadConversations();
      if (convs.length > 0) {
        const latest = convs[0];
        const lastActive = new Date(latest.lastActiveAt || latest.createdAt).getTime();
        if (Date.now() - lastActive < TWELVE_HOURS && latest.messages.length > 0) {
          setActiveId(latest.id);
          setMessages(latest.messages);
          return;
        }
      }
      startNewChat();
    }
  }, []);

  const handleFileSelect = async (files: FileList | null, type: "image" | "document") => {
    if (!files) return;
    setShowAttachMenu(false);
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`Arquivo "${file.name}" excede 10MB.`);
        continue;
      }
      try {
        if (type === "image" && IMAGE_TYPES.includes(file.type)) {
          const data = await fileToBase64(file);
          setPendingAttachments(prev => [...prev, { type: "image", name: file.name, data }]);
        } else {
          // For text-based files, read content
          let extractedText = "";
          if (file.type.startsWith("text/") || file.type === "application/json" || file.type === "application/xml") {
            extractedText = await readTextFile(file);
            if (extractedText.length > 15000) extractedText = extractedText.slice(0, 15000) + "\n...[truncado]";
          } else {
            extractedText = `Arquivo binário: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Tipo: ${file.type || "desconhecido"}. Para PDFs e documentos complexos, o conteúdo visual pode ser analisado se enviado como imagem/screenshot.`;
          }
          const data = await fileToBase64(file);
          setPendingAttachments(prev => [...prev, { type: "document", name: file.name, data, extractedText }]);
        }
      } catch {
        alert(`Erro ao processar "${file.name}".`);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getUserContext = () => {
    try {
      const fin = JSON.parse(localStorage.getItem("sparky-financial-data") || "{}");
      const cards = JSON.parse(localStorage.getItem("sparky-credit-cards") || "[]");
      const goals = JSON.parse(localStorage.getItem("sparky-investment-goals") || "[]");
      const chatStyle = localStorage.getItem("sparky-chat-style") || "";
      return {
        available: fin.balance ? fin.balance - (fin.scheduled || 0) : 0,
        real: fin.balance || 0,
        toPay: fin.scheduled || 0,
        income: fin.income || 0,
        expenses: fin.expenses || 0,
        cards: cards.length > 0 ? cards.map((c: any) => `${c.cardName} (${c.bankName}): limite R$${c.limit}, usado R$${c.usedAmount || 0}`).join("; ") : "Nenhum cadastrado",
        goals: goals.length > 0 ? goals.map((g: any) => `${g.name}: R$${g.savedAmount}/${g.targetAmount}`).join("; ") : "Nenhuma definida",
        chatStyle,
      };
    } catch { return null; }
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && pendingAttachments.length === 0) || isLoading) return;
    setInput("");
    const userMsg: Msg = {
      role: "user",
      content: text || (pendingAttachments.length > 0 ? `[${pendingAttachments.map(a => a.name).join(", ")}]` : ""),
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
    };
    setPendingAttachments([]);
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    try {
      // Prepare messages for API - include attachment data
      const apiMessages = [...messages, userMsg].map(msg => {
        if (msg.attachments && msg.attachments.length > 0) {
          return {
            role: msg.role,
            content: msg.content,
            attachments: msg.attachments.map(a => ({
              type: a.type,
              name: a.name,
              data: a.data,
              extractedText: a.extractedText,
            })),
          };
        }
        return { role: msg.role, content: msg.content };
      });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, userContext: getUserContext() }),
      });

      if (!resp.ok || !resp.body) throw new Error("Erro na resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const snap = assistantSoFar;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snap } : m));
                }
                return [...prev, { role: "assistant", content: snap }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const NewChatConfirmPopup = () => (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewChatConfirm(false)} />
      <div className="relative w-[85%] max-w-sm rounded-2xl bg-card border border-border p-5 shadow-xl animate-scale-in">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Plus size={22} className="text-primary" />
          </div>
          <h3 className="text-base font-bold">Nova conversa?</h3>
          <p className="text-xs text-muted-foreground">A conversa atual será salva no histórico. Deseja iniciar uma nova?</p>
          <div className="flex gap-2 w-full mt-2">
            <button onClick={() => setShowNewChatConfirm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground active:scale-[0.98] transition-all">
              Cancelar
            </button>
            <button onClick={startNewChat} className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground active:scale-[0.98] transition-all">
              Criar nova
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (showHistory) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-full hover:bg-muted active:scale-95">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-lg font-bold">Histórico</h1>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full hover:bg-muted active:scale-95">
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-9 bg-card border border-border rounded-xl shadow-lg z-10 py-1 min-w-[160px]">
                <button onClick={deleteAll} className="w-full px-4 py-2.5 text-xs text-destructive flex items-center gap-2 hover:bg-muted">
                  <Trash2 size={14} />
                  Apagar todos
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot size={28} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma conversa salva</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={cn(
                  "w-full text-left rounded-xl border border-border p-3 hover:bg-muted/50 transition-all active:scale-[0.98] flex items-center justify-between gap-2",
                  activeId === conv.id && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  {conv.summary && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{conv.summary}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(conv.createdAt).toLocaleDateString("pt-BR")} • {conv.messages.length} msgs
                  </p>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="p-1.5 rounded-full hover:bg-destructive/15 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))
          )}
        </div>
        <div className="px-4 pb-3 pt-2 border-t border-border">
          <button
            onClick={startNewChat}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Nova Conversa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {showNewChatConfirm && <NewChatConfirmPopup />}
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Sparky AI</h1>
            <p className="text-[10px] text-muted-foreground">Seu assistente financeiro inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowHistory(true)} className="p-2 rounded-full hover:bg-muted active:scale-95 text-muted-foreground" title="Histórico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <button onClick={handleNewChatClick} className="p-2 rounded-full hover:bg-muted active:scale-95 text-muted-foreground" title="Nova conversa">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot size={28} className="text-primary" />
            </div>
            <p className="text-sm font-semibold mb-1">Olá! Sou o Sparky 🐈‍⬛</p>
            <p className="text-xs text-muted-foreground max-w-[260px]">
              Pergunte sobre finanças, envie imagens de extratos ou documentos para análise!
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Bot size={12} className="text-primary" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border rounded-bl-md"
            )}>
              {/* Show attachment previews */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {msg.attachments.map((att, j) => (
                    <div key={j} className="rounded-lg overflow-hidden">
                      {att.type === "image" ? (
                        <img src={att.data} alt={att.name} className="max-h-32 max-w-[200px] rounded-lg object-cover" />
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-lg bg-black/20 px-2.5 py-1.5">
                          <FileText size={12} />
                          <span className="text-[10px] font-medium truncate max-w-[120px]">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                <User size={12} className="text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Bot size={12} className="text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto">
          {pendingAttachments.map((att, i) => (
            <div key={i} className="relative shrink-0 group">
              {att.type === "image" ? (
                <img src={att.data} alt={att.name} className="h-14 w-14 rounded-lg object-cover border border-border" />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-muted border border-border flex flex-col items-center justify-center gap-0.5">
                  <FileText size={16} className="text-muted-foreground" />
                  <span className="text-[7px] text-muted-foreground truncate w-12 text-center">{att.name.split('.').pop()?.toUpperCase()}</span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(i)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
          {/* Attach button */}
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <Paperclip size={16} />
            </button>
            {showAttachMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAttachMenu(false)} />
                <div className="absolute bottom-10 left-0 bg-card border border-border rounded-xl shadow-lg z-20 py-1.5 min-w-[160px]">
                  <button
                    onClick={() => { imageInputRef.current?.click(); }}
                    className="w-full px-4 py-2.5 text-xs flex items-center gap-2.5 hover:bg-muted transition-colors"
                  >
                    <Image size={14} className="text-primary" />
                    Enviar imagem
                  </button>
                  <button
                    onClick={() => { fileInputRef.current?.click(); }}
                    className="w-full px-4 py-2.5 text-xs flex items-center gap-2.5 hover:bg-muted transition-colors"
                  >
                    <FileText size={14} className="text-success" />
                    Enviar documento
                  </button>
                </div>
              </>
            )}
          </div>

          <input type="file" ref={imageInputRef} accept="image/*" multiple className="hidden" onChange={e => handleFileSelect(e.target.files, "image")} />
          <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.xml,.json" multiple className="hidden" onChange={e => handleFileSelect(e.target.files, "document")} />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Pergunte ao Sparky..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            disabled={isLoading || (!input.trim() && pendingAttachments.length === 0)}
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center transition-all active:scale-95",
              (input.trim() || pendingAttachments.length > 0) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
