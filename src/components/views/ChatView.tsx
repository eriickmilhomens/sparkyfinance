import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Plus, Trash2, ChevronLeft, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Msg[]; createdAt: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sparky-chat`;
const STORAGE_KEY = "sparky-chat-history";

const loadConversations = (): Conversation[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
};

const saveConversations = (convs: Conversation[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
};

const ChatView = () => {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save current conversation whenever messages change
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === activeId ? { ...c, messages, title: messages[0]?.content.slice(0, 40) || "Nova conversa" } : c
      );
      saveConversations(updated);
      return updated;
    });
  }, [messages, activeId]);

  const startNewChat = useCallback(() => {
    const id = crypto.randomUUID();
    const conv: Conversation = { id, title: "Nova conversa", messages: [], createdAt: new Date().toISOString() };
    setConversations(prev => {
      const updated = [conv, ...prev];
      saveConversations(updated);
      return updated;
    });
    setActiveId(id);
    setMessages([]);
    setShowHistory(false);
  }, []);

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

  // Auto-create new chat on first load if none active
  useEffect(() => {
    if (!activeId) startNewChat();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
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

  // History sidebar view
  if (showHistory) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)]">
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
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(conv.createdAt).toLocaleDateString("pt-BR")}
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
    <div className="flex flex-col h-[calc(100vh-5rem)]">
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
          <button onClick={startNewChat} className="p-2 rounded-full hover:bg-muted active:scale-95 text-muted-foreground" title="Nova conversa">
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
            <p className="text-sm font-semibold mb-1">Olá! Sou o Sparky 🐱</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Pergunte sobre finanças, investimentos, orçamento ou qualquer dúvida que tiver!
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
              "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border rounded-bl-md"
            )}>
              {msg.content}
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

      {/* Input */}
      <div className="px-4 pb-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Pergunte ao Sparky..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            disabled={isLoading || !input.trim()}
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center transition-all active:scale-95",
              input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
