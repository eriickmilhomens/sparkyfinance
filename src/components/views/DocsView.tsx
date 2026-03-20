import { useState } from "react";
import { Search, FolderOpen, Plus, Upload, Check, X, FileText, ScrollText, BookOpen, Files, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const filters = [
  { label: "Todos", icon: Files },
  { label: "Conta", icon: FileText },
  { label: "Contrato", icon: ScrollText },
  { label: "Documento", icon: BookOpen },
  { label: "Manual", icon: BookOpen },
  { label: "Outros", icon: FolderOpen, highlight: true },
];

const categories = ["Conta", "Contrato", "Documento", "Manual", "Outros"];

const DocsView = () => {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Documento");

  return (
    <>
      <div className="px-4 pb-24 space-y-4">
        <div className="pt-3">
          <h1 className="text-xl font-bold">Documentos</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.label)}
                className={cn(
                  "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95",
                  activeFilter === f.label
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground border border-border"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon size={12} className={f.highlight ? "text-warning" : ""} />
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 fade-in-up">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
            <FolderOpen size={32} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Nenhum documento</p>
          <p className="text-[11px] text-muted-foreground mb-4">Seus documentos aparecerão aqui</p>
          <button
            onClick={() => setUploadOpen(true)}
            className="rounded-xl border border-border px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={14} />
            Adicionar Documento
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setUploadOpen(false)} />
          <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Novo Documento</h2>
              <button onClick={() => setUploadOpen(false)} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Upload Zone */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 py-10 mb-5 cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.99]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 mb-3">
                <Upload size={20} className="text-primary" />
              </div>
              <p className="text-sm font-medium">Clique para enviar</p>
              <p className="text-[10px] text-muted-foreground mt-1">PDF ou Imagem</p>
            </div>

            {/* Info */}
            <p className="text-label mb-3">INFORMAÇÕES BÁSICAS</p>
            <div className="space-y-3 mb-5">
              <input
                type="text"
                placeholder="Nome do documento"
                className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <div>
                <label className="text-[11px] text-muted-foreground mb-1.5 block">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-95",
                        selectedCategory === cat
                          ? "bg-primary/15 text-primary border border-primary"
                          : "bg-muted/50 text-muted-foreground border border-border"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <p className="text-label mb-3">TAGS</p>
            <input
              type="text"
              placeholder="Adicionar tags separadas por vírgula"
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all mb-5"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setUploadOpen(false)}
                className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <Check size={16} />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocsView;
