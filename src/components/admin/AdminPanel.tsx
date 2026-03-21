import { useState, useEffect } from "react";
import { Users, Trash2, Shield, ChevronDown, RefreshCw, AlertTriangle, X, Mail, Phone, Calendar, Star } from "lucide-react";
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

const AdminPanel = ({ onClose }: { onClose: () => void }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
              <p className="text-xs text-muted-foreground">{users.length} usuários registrados</p>
            </div>
          </div>
          <button onClick={fetchUsers} className={cn("p-2 rounded-xl hover:bg-muted/50 transition-colors", loading && "animate-spin")}>
            <RefreshCw size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card-zelo text-center">
            <p className="text-lg font-bold">{users.length}</p>
            <p className="text-[9px] text-muted-foreground">Total</p>
          </div>
          <div className="card-zelo text-center">
            <p className="text-lg font-bold">{users.filter(u => u.provider === "google").length}</p>
            <p className="text-[9px] text-muted-foreground">Google</p>
          </div>
          <div className="card-zelo text-center">
            <p className="text-lg font-bold">{users.filter(u => u.provider === "email" || u.provider === "phone").length}</p>
            <p className="text-[9px] text-muted-foreground">Email/Tel</p>
          </div>
        </div>

        {/* Delete All */}
        <button
          onClick={() => setDeleteAllConfirm(true)}
          className="w-full card-zelo border-destructive/30 bg-destructive/5 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="h-10 w-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-destructive" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-destructive">Limpar todos os usuários</p>
            <p className="text-[10px] text-muted-foreground">Remove todos exceto sua conta admin</p>
          </div>
        </button>

        {/* Users List */}
        <p className="text-label px-1">USUÁRIOS REGISTRADOS</p>

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
            {users.map(user => (
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
          </div>
        )}

        {/* Developer signature */}
        <p className="text-center text-[9px] text-muted-foreground/50 py-4">
          Sparky Admin Panel — Erick Developer © 2026
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
              Esta ação é irreversível. O usuário será deslogado e precisará criar uma nova conta.
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
              exceto sua conta de administrador. Todos serão deslogados e precisarão recriar suas contas.
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
