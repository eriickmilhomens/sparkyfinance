import { FileText, Download, Eye } from "lucide-react";

const docs = [
  { name: "Comprovante Aluguel - Mar", date: "15/03/2026", type: "PDF" },
  { name: "Nota Fiscal - Mercado", date: "12/03/2026", type: "PDF" },
  { name: "Extrato Bancário - Fev", date: "01/03/2026", type: "PDF" },
  { name: "Comprovante Internet", date: "28/02/2026", type: "IMG" },
];

const DocsView = () => {
  return (
    <div className="px-4 pb-24 space-y-4">
      <div className="pt-3">
        <h1 className="text-xl font-bold">Documentos</h1>
        <p className="text-xs text-muted-foreground mt-1">{docs.length} arquivos salvos</p>
      </div>
      <div className="space-y-2">
        {docs.map((doc, i) => (
          <div key={doc.name} className={`card-zelo flex items-center gap-3 fade-in-up stagger-${i + 1}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
              <FileText size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.name}</p>
              <p className="text-[10px] text-muted-foreground">{doc.date} • {doc.type}</p>
            </div>
            <div className="flex gap-1">
              <button className="rounded-lg p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                <Eye size={16} />
              </button>
              <button className="rounded-lg p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                <Download size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocsView;
