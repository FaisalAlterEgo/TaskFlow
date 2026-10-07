"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Task, TaskInput, TaskPriority, TaskStatus ,History} from "@/lib/types";

interface TaskFormProps {
  task?: Task | null;
  busy: boolean;
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel?: () => void;
}

const dateValue = (date: string | null | undefined) =>
  date ? date.slice(0, 10) : "";

export function TaskForm({ task, busy, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "MEDIUM",
  );
  const [completionDesk, setCompletionDesk] = useState<string>(
    task?.completionDesk ?? "",
  );
  const [dueDate, setDueDate] = useState(dateValue(task?.dueDate));
  const [formError, setFormError] = useState<string | null>(null);
  const hasil =
    title == task?.title &&
    description == task?.description &&
    status == task?.status &&
    priority == task?.priority &&
    completionDesk == task?.completionDesk &&
    dueDate === dateValue(task?.dueDate);

  const statusOptions = status === "DONE" && completionDesk.length < 1;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return setFormError("Give your task a title.");
    if (description.length < 1 || description.trim() === "")
      return setFormError("Description must be at least 1 characters long.");
    if (cleanTitle.length > 120)
      return setFormError("Keep the title under 120 characters.");
    setFormError(null);
    if (
      task &&
      (completionDesk.length < 1 || completionDesk.trim() === "") &&
      status === "DONE"
    )
      return setFormError(
        "Completion desk must be at least 1 characters long.",
      );
    try {
      await onSubmit({
        title: cleanTitle,
        description: description.trim() || null,
        status,
        priority,
        dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
        completionDesk: completionDesk.trim() || "",
      });
      if (!task) {
        setTitle("");
        setDescription("");
        setStatus("TODO");
        setPriority("MEDIUM");
        setDueDate("");
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save the task.",
      );
    }
  }
  return (
    <Card className="sticky top-6 overflow-hidden">
      <CardHeader className="border-b bg-[#fbfcfa]">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
            {task ? <Save className="size-4" /> : <Plus className="size-4" />}
          </div>
          <div>
            <CardTitle>{task ? "Edit task" : "Add a task"}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {task
                ? "Update the details below."
                : "Capture what needs your attention."}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              placeholder="Add notes or context…"
            />
          </div>
          <div className="space-y-2">
            {task && (
              <div>
                <Label htmlFor="completionDesk">Completion Desk</Label>
                <Textarea
                  id="completionDesk"
                  value={completionDesk}
                  onChange={(e) => setCompletionDesk(e.target.value)}
                  maxLength={1000}
                  placeholder="Add notes or context…"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              {task ? (
                <Select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancel</option>
                </Select>
              ) : (
                <Select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                </Select>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">
              Due date{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          {formError && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {formError}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1"
              disabled={busy || hasil || statusOptions}
              type="submit"
            >
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {task ? "Save changes" : "Create task"}
            </Button>
            {task && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
