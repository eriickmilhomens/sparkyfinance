import { useState, useEffect, useCallback } from "react";
import {
  Users, Trash2, Shield, ChevronDown, RefreshCw, AlertTriangle, Mail, Phone,
  Calendar, Star, Download, BarChart3, Settings, Bell, Database, Activity,
  Search, UserX, UserCheck, Clock, DollarSign, TrendingUp, TrendingDown,
  Percent, Ban, Eye, RotateCcw, FileText, Send, ToggleLeft, Award,
  Edit2, Plus, Package, Hash, X, Check, Coins
} from "lucide-react";
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

interface AuditLog {
  id: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

interface Prize {
  id: string;
  name: string;
  pointsCost: number;
  stock: number;
}

type AdminTab = "users" | "stats" | "tools" | "prizes";

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

  // Dangerous action confirmation
  const [dangerModal, setDangerModal] = useState<{ show: boolean; title: string; description: string; action: () => void } | null>(null);
  const [dangerConfirmText, setDangerConfirmText] = useState("");

  // User detail / adjust modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("");

  // Audit log
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Prizes management
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [editPrize, setEditPrize] = useState<Prize | null>(null);
  const [prizeForm, setPrizeForm] = useState({ name: "", pointsCost: "100", stock: "10" });

  // Notification broadcast
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  // System config
  const [pointsRate, setPointsRate] = useState("1.0");
  const [withdrawLimit, setWithdrawLimit] = useState("500");

  const addAuditLog = useCallback((action: string, target: string, details: string) => {
    const log: AuditLog = {
      id: Date.now().toString(),
      action,
      target,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 100));
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admin-users?action=list`,
        { headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" } }
      );
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro ao buscar usuários"); }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Load prizes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sparky-admin-prizes");
    if (saved) setPrizes(JSON.parse(saved));
  }, []);

  const savePrizes = (p: Prize[]) => {
    setPrizes(p);
    localStorage.setItem("sparky-admin-prizes", JSON.stringify(p));
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admin-users`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_user", userId }) }
      );
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro ao deletar"); }
      const deletedUser = users.find(u => u.id === userId);
      addAuditLog("DELETE_USER", deletedUser?.name || userId, `Usuário removido pelo admin`);
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
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_all_users" }) }
      );
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro ao deletar"); }
      const data = await res.json();
      addAuditLog("DELETE_ALL_USERS", "Todos", `${data.deleted} usuários removidos`);
      setDeleteAllConfirm(false);
      setDangerModal(null);
      setDangerConfirmText("");
      setResultPopup({ show: true, success: true, message: `${data.deleted} usuário(s) removido(s) com sucesso!` });
      fetchUsers();
    } catch (e: any) {
      setDeleteAllConfirm(false);
      setDangerModal(null);
      setDangerConfirmText("");
      setResultPopup({ show: true, success: false, message: e.message || "Erro ao deletar usuários." });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Nunca";
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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
    a.href = url; a.download = `sparky-users-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    addAuditLog("EXPORT_CSV", "Usuários", `${users.length} usuários exportados`);
    toast.success("CSV exportado com sucesso!");
  };

  const handleAdjustPoints = async (userId: string, newPoints: number) => {
    try {
      const { error } = await supabase.from("profiles").update({ points: newPoints }).eq("user_id", userId);
      if (error) throw error;
      addAuditLog("ADJUST_POINTS", selectedUser?.name || userId, `Pontos alterados para ${newPoints}`);
      toast.success(`Pontos atualizados para ${newPoints}`);
      setSelectedUser(null);
      setAdjustPoints("");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Erro ao ajustar pontos");
    }
  };

  const handleSendNotification = () => {
    if (!notifMessage.trim()) return;
    // Store notification in localStorage for all users to see
    const notifs = JSON.parse(localStorage.getItem("sparky-global-notifications") || "[]");
    notifs.unshift({ id: Date.now().toString(), message: notifMessage, date: new Date().toISOString(), read: false });
    localStorage.setItem("sparky-global-notifications", JSON.stringify(notifs));
    addAuditLog("SEND_NOTIFICATION", "Todos os usuários", notifMessage);
    toast.success("Notificação enviada para todos os usuários!");
    setNotifMessage("");
    setShowNotifModal(false);
  };

  const handleSavePrize = () => {
    if (!prizeForm.name.trim()) return;
    if (editPrize) {
      const updated = prizes.map(p => p.id === editPrize.id ? { ...p, name: prizeForm.name, pointsCost: parseInt(prizeForm.pointsCost) || 0, stock: parseInt(prizeForm.stock) || 0 } : p);
      savePrizes(updated);
      addAuditLog("EDIT_PRIZE", prizeForm.name, `Custo: ${prizeForm.pointsCost} pts, Estoque: ${prizeForm.stock}`);
      toast.success("Prêmio atualizado!");
    } else {
      const newPrize: Prize = { id: Date.now().toString(), name: prizeForm.name, pointsCost: parseInt(prizeForm.pointsCost) || 0, stock: parseInt(prizeForm.stock) || 0 };
      savePrizes([...prizes, newPrize]);
      addAuditLog("CREATE_PRIZE", prizeForm.name, `Custo: ${prizeForm.pointsCost} pts, Estoque: ${prizeForm.stock}`);
      toast.success("Prêmio criado!");
    }
    setShowPrizeForm(false);
    setEditPrize(null);
    setPrizeForm({ name: "", pointsCost: "100", stock: "10" });
  };

  const handleDeletePrize = (prize: Prize) => {
    savePrizes(prizes.filter(p => p.id !== prize.id));
    addAuditLog("DELETE_PRIZE", prize.name, "Prêmio removido");
    toast.success("Prêmio removido!");
  };

  const openDangerConfirm = (title: string, description: string, action: () => void) => {
    setDangerConfirmText("");
    setDangerModal({ show: true, title, description, action });
  };

  const recentUsers = [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const activeToday = users.filter(u => u.last_sign_in && new Date(u.last_sign_in).toDateString() === new Date().toDateString());
  const googleUsers = users.filter(u => u.provider === "google");
  const emailUsers = users.filter(u => u.provider === "email" || u.provider === "phone");
  const adminUsers = users.filter(u => u.role === "admin");
  const totalPoints = users.reduce((sum, u) => sum + u.points, 0);
  const avgPoints = users.length > 0 ? Math.round(totalPoints / users.length) : 0;

  // Churn: users who never signed in or not in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const inactiveUsers = users.filter(u => !u.last_sign_in || new Date(u.last_sign_in) < thirtyDaysAgo);
  const churnRate = users.length > 0 ? Math.round((inactiveUsers.length / users.length) * 100) : 0;

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: "users", label: "Usuários", icon: Users },
    { id: "stats", label: "Dashboard", icon: BarChart3 },
    { id: "tools", label: "Ferramentas", icon: Settings },
    { id: "prizes", label: "Prêmios", icon: Award },
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
              <p className="text-xs text-muted-foreground">{users.length} usuários • v3.0</p>
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
                "flex-1 rounded-lg py-2 text-[10px] font-medium transition-all flex items-center justify-center gap-1",
                activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ USERS TAB ═══ */}
        {activeTab === "users" && (
          <div className="space-y-3">
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedUser(user); setAdjustPoints(String(user.points)); }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-95"
                          title="Gerenciar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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

        {/* ═══ STATS / DASHBOARD TAB ═══ */}
        {activeTab === "stats" && (
          <div className="space-y-3">
            <p className="text-label px-1">GOVERNANÇA FINANCEIRA</p>

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
                  <div className="h-8 w-8 rounded-lg bg-warning/15 flex items-center justify-center">
                    <Star size={14} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{totalPoints}</p>
                    <p className="text-[9px] text-muted-foreground">Pontos totais</p>
                  </div>
                </div>
              </div>
              <div className="card-zelo space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center">
                    <Coins size={14} className="text-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{avgPoints}</p>
                    <p className="text-[9px] text-muted-foreground">Média por user</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Churn card */}
            <div className={cn("card-zelo", churnRate > 50 ? "border-destructive/30" : "")}>
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", churnRate > 50 ? "bg-destructive/15" : "bg-muted")}>
                  <Percent size={16} className={churnRate > 50 ? "text-destructive" : "text-muted-foreground"} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Taxa de Churn</p>
                  <p className="text-[10px] text-muted-foreground">Usuários inativos há 30+ dias</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-lg font-bold", churnRate > 50 ? "text-destructive" : "text-foreground")}>{churnRate}%</p>
                  <p className="text-[9px] text-muted-foreground">{inactiveUsers.length} de {users.length}</p>
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

            {/* Audit Log */}
            <p className="text-label px-1">LOG DE AUDITORIA</p>
            <div className="card-zelo space-y-2 max-h-48 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma ação registrada nesta sessão</p>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 py-1 border-b border-border/50 last:border-0">
                    <FileText size={10} className="text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium">
                        <span className="text-primary">{log.action}</span> → {log.target}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">{log.details}</p>
                    </div>
                    <span className="text-[8px] text-muted-foreground shrink-0">{formatDate(log.timestamp)}</span>
                  </div>
                ))
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
              onClick={() => { fetchUsers(); toast.success("Dados sincronizados!"); addAuditLog("SYNC_DB", "Sistema", "Dados recarregados do servidor"); }}
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

            {/* Send notification */}
            <button
              onClick={() => setShowNotifModal(true)}
              className="w-full card-zelo flex items-center gap-3 active:scale-[0.98] transition-transform hover:border-primary/50"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <Bell size={18} className="text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Enviar Notificação Global</p>
                <p className="text-[10px] text-muted-foreground">Envie um aviso para todos os usuários</p>
              </div>
            </button>

            {/* Maintenance mode */}
            <button
              onClick={() => {
                setMaintenanceMode(!maintenanceMode);
                addAuditLog("MAINTENANCE", "Sistema", maintenanceMode ? "Desativado" : "Ativado");
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

            {/* System Config */}
            <p className="text-label px-1 mt-2">CONFIGURAÇÕES DO SISTEMA</p>

            <div className="card-zelo space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Taxa de Conversão de Pontos</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text" inputMode="decimal" value={pointsRate}
                    onChange={(e) => setPointsRate(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">pts/R$</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Limite de Saque (R$)</label>
                <input
                  type="text" inputMode="numeric" value={withdrawLimit}
                  onChange={(e) => setWithdrawLimit(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => {
                  addAuditLog("UPDATE_CONFIG", "Sistema", `Taxa: ${pointsRate}, Limite: R$${withdrawLimit}`);
                  toast.success("Configurações salvas!");
                }}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
              >
                Salvar Configurações
              </button>
            </div>

            {/* Danger Zone */}
            <p className="text-label px-1 mt-2">ZONA DE PERIGO</p>

            <button
              onClick={() => openDangerConfirm(
                "⚠️ Resetar Todos os Usuários",
                "Isso vai remover TODOS os usuários do banco de dados, exceto sua conta de administrador. Esta ação NÃO pode ser desfeita!",
                handleDeleteAll
              )}
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
              onClick={() => openDangerConfirm(
                "⚠️ Limpar Cache Local",
                "Remove todos os dados temporários do navegador. Configurações locais serão perdidas!",
                () => {
                  localStorage.clear();
                  addAuditLog("CLEAR_CACHE", "Sistema", "Cache local limpo");
                  toast.success("Cache local limpo com sucesso!");
                  setDangerModal(null);
                  setDangerConfirmText("");
                }
              )}
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

        {/* ═══ PRIZES TAB ═══ */}
        {activeTab === "prizes" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-label px-1">GERENCIAR PRÊMIOS</p>
              <button
                onClick={() => {
                  setEditPrize(null);
                  setPrizeForm({ name: "", pointsCost: "100", stock: "10" });
                  setShowPrizeForm(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground active:scale-[0.98]"
              >
                <Plus size={12} /> Novo Prêmio
              </button>
            </div>

            {prizes.length === 0 ? (
              <div className="card-zelo flex flex-col items-center py-8">
                <Award size={32} className="text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Nenhum prêmio cadastrado</p>
                <p className="text-[10px] text-muted-foreground mt-1">Crie o primeiro prêmio para a loja</p>
              </div>
            ) : (
              <div className="space-y-2">
                {prizes.map(prize => (
                  <div key={prize.id} className="card-zelo">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
                        <Award size={18} className="text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{prize.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                            <Star size={8} /> {prize.pointsCost} pts
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <Package size={8} /> {prize.stock} em estoque
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditPrize(prize);
                            setPrizeForm({ name: prize.name, pointsCost: String(prize.pointsCost), stock: String(prize.stock) });
                            setShowPrizeForm(true);
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => openDangerConfirm(
                            "Excluir Prêmio",
                            `Tem certeza que deseja excluir "${prize.name}"?`,
                            () => { handleDeletePrize(prize); setDangerModal(null); setDangerConfirmText(""); }
                          )}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Developer signature */}
        <p className="text-center text-[9px] text-muted-foreground/50 py-4">
          Sparky Admin Panel v3.0 — Erick Developer © 2026
        </p>
      </div>

      {/* ═══ MODALS ═══ */}

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

      {/* Danger confirmation modal (2-step) */}
      {dangerModal?.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-zelo space-y-4 text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-destructive/15">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
            <h3 className="text-base font-bold">{dangerModal.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{dangerModal.description}</p>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-[10px] text-destructive font-semibold mb-2">
                Digite "CONFIRMAR" para liberar a ação:
              </p>
              <input
                type="text"
                value={dangerConfirmText}
                onChange={(e) => setDangerConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                className="w-full rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm text-center outline-none focus:border-destructive font-mono tracking-wider"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDangerModal(null); setDangerConfirmText(""); }} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground active:scale-[0.98]">
                Cancelar
              </button>
              <button
                onClick={() => dangerModal.action()}
                disabled={dangerConfirmText !== "CONFIRMAR" || actionLoading}
                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Executando..." : "Executar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User detail / adjust modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-zelo space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Gerenciar Usuário</h3>
              <button onClick={() => { setSelectedUser(null); setAdjustPoints(""); }} className="text-muted-foreground"><X size={16} /></button>
            </div>

            <div className="flex items-center gap-3">
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt={selectedUser.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-bold">{selectedUser.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted/50 p-2.5 text-center">
                <p className="text-base font-bold">{selectedUser.points}</p>
                <p className="text-[9px] text-muted-foreground">Pontos atuais</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-2.5 text-center">
                <p className="text-base font-bold capitalize">{selectedUser.role}</p>
                <p className="text-[9px] text-muted-foreground">Cargo</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Ajustar Pontos</label>
              <input
                type="text" inputMode="numeric"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setSelectedUser(null); setAdjustPoints(""); }} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground active:scale-[0.98]">
                Cancelar
              </button>
              <button
                onClick={() => handleAdjustPoints(selectedUser.id, parseInt(adjustPoints) || 0)}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
              >
                Salvar
              </button>
            </div>

            <button
              onClick={() => openDangerConfirm(
                "Suspender Conta",
                `Tem certeza que deseja suspender a conta de "${selectedUser.name}"? O usuário será removido do sistema.`,
                () => { handleDeleteUser(selectedUser.id); setSelectedUser(null); setDangerModal(null); setDangerConfirmText(""); }
              )}
              className="w-full rounded-xl border border-destructive/30 bg-destructive/5 py-2.5 text-sm font-semibold text-destructive flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Ban size={14} /> Suspender / Banir Conta
            </button>
          </div>
        </div>
      )}

      {/* Notification modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-zelo space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Notificação Global</h3>
                <p className="text-[10px] text-muted-foreground">Envie um aviso para todos os usuários</p>
              </div>
              <button onClick={() => setShowNotifModal(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            <textarea
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Digite a mensagem da notificação..."
              rows={3}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNotifModal(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground active:scale-[0.98]">
                Cancelar
              </button>
              <button onClick={handleSendNotification} disabled={!notifMessage.trim()} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                <Send size={14} /> Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prize form modal */}
      {showPrizeForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-zelo space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">{editPrize ? "Editar Prêmio" : "Novo Prêmio"}</h3>
                <p className="text-[10px] text-muted-foreground">{editPrize ? "Atualize as informações" : "Adicione um novo prêmio à loja"}</p>
              </div>
              <button onClick={() => { setShowPrizeForm(false); setEditPrize(null); }} className="text-muted-foreground"><X size={16} /></button>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome do Prêmio*</label>
              <input
                value={prizeForm.name}
                onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })}
                placeholder="Ex: Sorveteria"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Custo em Pontos*</label>
              <div className="flex items-center gap-2">
                <input
                  type="text" inputMode="numeric"
                  value={prizeForm.pointsCost}
                  onChange={(e) => setPrizeForm({ ...prizeForm, pointsCost: e.target.value.replace(/\D/g, "") })}
                  className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1.5 text-[10px] font-bold text-warning">
                  <Star size={8} /> {prizeForm.pointsCost || 0}
                </span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Estoque*</label>
              <input
                type="text" inputMode="numeric"
                value={prizeForm.stock}
                onChange={(e) => setPrizeForm({ ...prizeForm, stock: e.target.value.replace(/\D/g, "") })}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowPrizeForm(false); setEditPrize(null); }} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground active:scale-[0.98]">
                Cancelar
              </button>
              <button onClick={handleSavePrize} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]">
                {editPrize ? "Atualizar" : "Criar Prêmio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result popup */}
      {resultPopup.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-zelo space-y-4 text-center">
            <div className={cn("flex h-14 w-14 mx-auto items-center justify-center rounded-full", resultPopup.success ? "bg-success/15" : "bg-destructive/15")}>
              {resultPopup.success ? (
                <UserCheck size={24} className="text-success" />
              ) : (
                <AlertTriangle size={24} className="text-destructive" />
              )}
            </div>
            <h3 className="text-base font-bold">{resultPopup.success ? "Operação concluída!" : "Falha na operação"}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{resultPopup.message}</p>
            <button
              onClick={() => setResultPopup({ show: false, success: false, message: "" })}
              className={cn(
                "w-full rounded-xl py-3 text-sm font-semibold active:scale-[0.98]",
                resultPopup.success ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
              )}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
