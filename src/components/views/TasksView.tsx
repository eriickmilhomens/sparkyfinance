import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const initialTasks = [
  { id: 1, text: "Pagar conta de luz", done: false, pts: 10 },
  { id: 2, text: "Conferir extrato bancário", done: true, pts: 5 },
  { id: 3, text: "Atualizar orçamento mensal", done: false, pts: 15 },
  { id: 4, text: "Revisar assinaturas ativas", done: false, pts: 10 },
];

const TasksView = () => {
  const [tasks, setTasks] = useState(initialTasks);

  const toggle = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="px-4 pb-24 space-y-4">
      <div className="pt-3">
        <h1 className="text-xl font-bold">Tarefas</h1>
        <p className="text-xs text-muted-foreground mt-1">Complete tarefas e ganhe pontos</p>
      </div>
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <button
            key={task.id}
            onClick={() => toggle(task.id)}
            className={cn(
              "card-zelo w-full flex items-center gap-3 text-left transition-all active:scale-[0.98] fade-in-up",
              `stagger-${i + 1}`
            )}
          >
            {task.done ? (
              <CheckCircle2 size={20} className="text-success flex-shrink-0" />
            ) : (
              <Circle size={20} className="text-muted-foreground flex-shrink-0" />
            )}
            <span className={cn("text-sm flex-1", task.done && "line-through text-muted-foreground")}>
              {task.text}
            </span>
            <span className="text-[10px] font-semibold text-warning tabular-nums">+{task.pts} pts</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TasksView;
