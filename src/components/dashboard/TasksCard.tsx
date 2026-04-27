import { CheckCircle2 } from "lucide-react";
import InfoButton from "@/components/InfoButton";

const TasksCard = () => {
  return (
    <div className="card-zelo fade-in-up stagger-3 relative">
      <div className="absolute top-3 right-3">
        <InfoButton
          title="Tarefas Financeiras"
          description="Lembretes automáticos de ações importantes (pagar fatura, revisar orçamento, etc.). Aparecerão aqui quando houver pendências."
          align="right"
        />
      </div>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 mb-3">
          <CheckCircle2 size={24} className="text-success" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Nenhuma tarefa pendente</p>
      </div>
    </div>
  );
};

export default TasksCard;
