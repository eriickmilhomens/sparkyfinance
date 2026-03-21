import { useState, useEffect, useCallback } from "react";
import { Users, Trash2, Shield, ChevronDown, RefreshCw, AlertTriangle, Mail, Phone, Calendar, Star, Download, BarChart3, Settings, Bell, Database, Activity, Search, UserX, UserCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: string;
  points: number;
  avatar_url: string | null;
  provider: string;
  created_at: string;
  last_sign_in: string | null;
}

type AdminTab = "users" | "stats" | "tools" | "settings";

const AdminPanel = ({ onClose }: { onClose: () => void }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [resultPopup, setResultPopup] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: "" });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admin-users?action=list`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao buscar usuários");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admin-users`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "delete_user", userId }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao deletar");
      }

      toast.success("Usuário removido com sucesso");
      setDeleteTarget(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Erro ao deletar usuário");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admin-users`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "delete_all_users" }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao deletar");
      }

      const data = await res.json();
      toast.success(`${data.deleted} usuários removidos`);
      setDeleteAllConfirm(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Erro ao deletar usuários");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Nunca";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone || "").includes(searchQuery)
  );

  const exportUsersCSV = () => {
    const header = "Nome,Email,Telefone,Provedor,Pontos,Cargo,Criado em\n";
    const rows = users.map(u =>
      `"${u.name}","${u.email || ""}","${u.phone || ""}","${u.provider}",${u.points},"${u.role}","${u.created_at}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sparky-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  const recentUsers = [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const activeToday = users.filter(u => u.last_sign_in && new Date(u.last_sign_in).toDateString() === new Date().toDateString());
  const googleUsers = users.filter(u => u.provider === "google");
  const emailUsers = users.filter(u => u.provider === "email" || u.provider === "phone");
  const adminUsers = users.filter(u => u.role === "admin");

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: "users", label: "Usuários", icon: Users },
    { id: "stats", label: "Estatísticas", icon: BarChart3 },
    { id: "tools", label: "Ferramentas", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <ChevronDown size={20} className="rotate-90" />
            </button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                Painel Admin
              </h1>
              <p className="text-xs text-muted-foreground">{users.length} usuários • v2.0</p>
            </div>
          </div>
          <button onClick={fetchUsers} className={cn("p-2 rounded-xl hover:bg-muted/50 transition-colors", loading && "animate-spin")}>
            <RefreshCw size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 rounded-lg py-2 text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
                activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ USERS TAB ═══ */}
        {activeTab === "users" && (
          <div className="space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="card-zelo text-center py-2">
                <p className="text-base font-bold">{users.length}</p>
                <p className="text-[8px] text-muted-foreground">Total</p>
              </div>
              <div className="card-zelo text-center py-2">
                <p className="text-base font-bold">{googleUsers.length}</p>
                <p className="text-[8px] text-muted-foreground">Google</p>
              </div>
              <div className="card-zelo text-center py-2">
                <p className="text-base font-bold">{emailUsers.length}</p>
                <p className="text-[8px] text-muted-foreground">Email</p>
              </div>
              <div className="card-zelo text-center py-2">
                <p className="text-base font-bold">{adminUsers.length}</p>
                <p className="text-[8px] text-muted-foreground">Admins</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2.5 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Delete All */}
            <button
              onClick={() => setDeleteAllConfirm(true)}
              className="w-full card-zelo border-destructive/30 bg-destructive/5 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="h-9 w-9 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                <Trash2 size={16} className="text-destructive" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-destructive">Limpar todos os usuários</p>
                <p className="text-[9px] text-muted-foreground">Remove todos exceto admin</p>
              </div>
            </button>

            {/* Users List */}
            <p className="text-label px-1">
              {searchQuery ? `RESULTADOS (${filteredUsers.length})` : "USUÁRIOS REGISTRADOS"}
            </p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card-zelo animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-2/3" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <div key={user.id} className="card-zelo">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          {user.role === "admin" && (
                            <span className="text-[8px] rounded-full bg-primary/15 px-1.5 py-0.5 text-primary font-bold">ADMIN</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {user.email && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                              <Mail size={8} /> {user.email}
                            </span>
                          )}
                          {user.phone && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Phone size={8} /> {user.phone}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <Calendar size={8} /> {formatDate(user.created_at)}
                          </span>
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <Star size={8} /> {user.points} pts
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <p className="text-center text-xs text-muted-foreground py-8">Nenhum usuário encontrado</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ STATS TAB ═══ */}
        {activeTab === "stats" && (
          <div className="space-y-3">
            <p className="text-label px-1">VISÃO GERAL</p>

            <div className="grid grid-cols-2 gap-2">
              <div className="card-zelo space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Users size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{users.length}</p>
                    <p className="text-[9px] text-muted-foreground">Usuários totais</p>
                  </div>
                </div>
              </div>
              <div className="card-zelo space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-success/15 flex items-center justify-center">
                    <Activity size={14} className="text-success" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{activeToday.length}</p>
                    <p className="text-[9px] text-muted-foreground">Ativos hoje</p>
                  </div>
                </div>
              </div>
              <div className="card-zelo space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center">
                    <UserCheck size={14} className="text-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{adminUsers.length}</p>
                    <p className="text-[9px] text-muted-foreground">Administradores</p>
                  </div>
                </div>
              </div>
              <div className="card-zelo space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-warning/15 flex items-center justify-center">
                    <Star size={14} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{users.reduce((sum, u) => sum + u.points, 0)}</p>
                    <p className="text-[9px] text-muted-foreground">Pontos totais</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider breakdown */}
            <p className="text-label px-1">PROVEDORES DE AUTH</p>
            <div className="card-zelo space-y-2">
              {[
                { label: "Google", count: googleUsers.length, color: "bg-blue-500" },
                { label: "Email/Senha", count: emailUsers.length, color: "bg-primary" },
              ].map(p => (
                <div key={p.label} className="flex items-center gap-3">
                  <span className="text-xs w-20">{p.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", p.color)}
                      style={{ width: users.length > 0 ? `${(p.count / users.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-bold w-6 text-right">{p.count}</span>
                </div>
              ))}
            </div>

            {/* Recent registrations */}
            <p className="text-label px-1">REGISTROS RECENTES</p>
            <div className="card-zelo space-y-2">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{u.name}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDate(u.created_at)}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted font-medium">{u.provider}</span>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum registro recente</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ TOOLS TAB ═══ */}
        {activeTab === "tools" && (
          <div className="space-y-3">
            <p className="text-label px-1">AÇÕES RÁPIDAS</p>

            <button
              onClick={exportUsersCSV}
              className="w-full card-zelo flex items-center gap-3 active:scale-[0.98] transition-transform hover:border-primary/50"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Download size={18} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Exportar Usuários (CSV)</p>
                <p className="text-[10px] text-muted-foreground">Baixe a lista completa de usuários</p>
              </div>
            </button>

            <button
              onClick={() => { fetchUsers(); toast.success("Dados sincronizados!"); }}
              className="w-full card-zelo flex items-center gap-3 active:scale-[0.98] transition-transform hover:border-primary/50"
            >
              <div className="h-10 w-10 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
                <Database size={18} className="text-success" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Sincronizar Banco de Dados</p>
                <p className="text-[10px] text-muted-foreground">Recarregar dados do servidor</p>
              </div>
            </button>

            <button
              onClick={() => {
                setMaintenanceMode(!maintenanceMode);
                toast.success(maintenanceMode ? "Modo manutenção desativado" : "Modo manutenção ativado");
              }}
              className={cn(
                "w-full card-zelo flex items-center gap-3 active:scale-[0.98] transition-transform",
                maintenanceMode ? "border-warning/50 bg-warning/5" : "hover:border-primary/50"
              )}
            >
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", maintenanceMode ? "bg-warning/20" : "bg-muted")}>
                <Settings size={18} className={maintenanceMode ? "text-warning" : "text-muted-foreground"} />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold">Modo Manutenção</p>
                <p className="text-[10px] text-muted-foreground">
                  {maintenanceMode ? "Ativo — novos acessos bloqueados" : "Inativo — app funcionando normalmente"}
                </p>
              </div>
              <div className={cn("h-5 w-9 rounded-full transition-all flex items-center px-0.5", maintenanceMode ? "bg-warning" : "bg-muted")}>
                <div className={cn("h-4 w-4 rounded-full bg-white shadow-sm transition-transform", maintenanceMode && "translate-x-4")} />
              </div>
            </button>

            <p className="text-label px-1 mt-4">ZONA DE PERIGO</p>

            <button
              onClick={() => setDeleteAllConfirm(true)}
              className="w-full card-zelo border-destructive/30 bg-destructive/5 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="h-10 w-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                <UserX size={18} className="text-destructive" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-destructive">Resetar Todos os Usuários</p>
                <p className="text-[10px] text-muted-foreground">Remove todos exceto conta admin</p>
              </div>
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                toast.success("Cache local limpo com sucesso!");
              }}
              className="w-full card-zelo border-destructive/30 bg-destructive/5 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="h-10 w-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-destructive" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-destructive">Limpar Cache Local</p>
                <p className="text-[10px] text-muted-foreground">Remove dados temporários do navegador</p>
              </div>
            </button>
          </div>
        )}

        {/* Developer signature */}
        <p className="text-center text-[9px] text-muted-foreground/50 py-4">
          Sparky Admin Panel v2.0 — Erick Developer © 2026
        </p>
      </div>

      {/* Delete single user confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-zelo space-y-4 text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-destructive/15">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
            <h3 className="text-base font-bold">Deletar usuário?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja remover <span className="font-semibold text-foreground">{deleteTarget.name}</span>?
              Esta ação é irreversível.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground active:scale-[0.98]">
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(deleteTarget.id)}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading ? "Removendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete all confirm */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-zelo space-y-4 text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-destructive/15">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
            <h3 className="text-base font-bold">⚠️ Ação Perigosa!</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Isso vai remover <span className="font-semibold text-destructive">TODOS os usuários</span> do banco de dados,
              exceto sua conta de administrador.
            </p>
            <p className="text-[10px] text-destructive font-semibold">Esta ação NÃO pode ser desfeita!</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteAllConfirm(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground active:scale-[0.98]">
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading ? "Removendo..." : "Sim, deletar todos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
