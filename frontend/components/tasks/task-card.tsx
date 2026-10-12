"use client";

import {
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};
const priorityStyles = {
  LOW: "outline",
  MEDIUM: "warning",
  HIGH: "destructive",
} as const;

interface TaskCardProps {
  task: Task;
  busy: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onHistoryClick?: (task: Task) => void;
}

export function TaskCard({
  task,
  busy,
  onEdit,
  onDelete,
  onStatusChange,
  onHistoryClick,
}: TaskCardProps) {
  const done = task.status === "DONE";
  const cancelled = task.status === "CANCELLED";
  const overdue = Boolean(
    task.dueDate && !done && !cancelled && (new Date(task.dueDate) < new Date()),
  );
  const due = task.dueDate
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(task.dueDate))
    : null;

  return (
    <Card
      className={cn(
        "group transition hover:-translate-y-0.5 hover:shadow-md",
        done && "bg-[#fafbfa]",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <button
            aria-label={done ? "Mark task as not done" : "Mark task as done"}
            disabled={busy || cancelled}
            onClick={() => onStatusChange(task, done ? "TODO" : "DONE")}
            className={cn(
              "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition",
              done
                ? "border-primary bg-primary text-white"
                : "border-[#aebbb2] text-transparent hover:border-primary",
            )}
          >
            <Check className="size-3.5" strokeWidth={3} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3
                  className={cn(
                    "font-semibold leading-6",
                    done && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {task.description}
                  </p>
                )}
              </div>
              <Badge variant={priorityStyles[task.priority]}>
                {task.priority}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {task.status === "DONE" ? (
                    <Check className="size-3.5" />
                  ) : task.status === "IN_PROGRESS" ? (
                    <Clock3 className="size-3.5" />
                  ) : (
                    <Circle className="size-3.5" />
                  )}
                  {statusLabels[task.status]}
                </span>
                {due && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      overdue && "font-semibold text-red-650 text-red-700",
                    )}
                  >
                    <CalendarDays className="size-3.5" />
                    {overdue ? "Overdue · " : ""}
                    {due}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Select
                  aria-label="Change status"
                  className="h-8 w-32 py-1 text-xs shadow-none"
                  value={task.status}
                  disabled={busy || cancelled}
                  onChange={(e) =>
                    onStatusChange(task, e.target.value as TaskStatus)
                  }
                >
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${task.title}`}
                  disabled={busy || cancelled}
                  onClick={() => onEdit(task)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:bg-red-50 hover:text-red-700"
                  aria-label={`Delete ${task.title}`}
                  disabled={busy}
                  onClick={() => onDelete(task)}
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
                  aria-label={`View history for ${task.title}`}
                  disabled={busy}
                  onClick={() => onHistoryClick && onHistoryClick(task)}
                >
                  <Clock3 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
