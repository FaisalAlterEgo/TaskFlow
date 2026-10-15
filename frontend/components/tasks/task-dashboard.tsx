"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  ListTodo,
  LogOut,
  RefreshCw,
  Search,
  TimerReset,
} from "lucide-react";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { taskApi } from "@/lib/api";
import type {
  Task,
  TaskFilters,
  TaskInput,
  TaskPriority,
  TaskStatus,
  User,
  History,
} from "@/lib/types";

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

interface TaskDashboardProps {
  user: User;
  onLogout: () => Promise<void>;
}

export function TaskDashboard({ user, onLogout }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    status: "ALL",
    priority: "ALL",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [history, setHistory] = useState<History[] | null>(null);
  const [historyTask, setHistoryTask] = useState<null | Task>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const loadTasks = useCallback(async () => {
    try {
      const response = await taskApi.list(filters);
      setTasks(response.data);
      setError(null);
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => void loadTasks(),
      filters.search ? 250 : 0,
    );
    return () => window.clearTimeout(timeout);
  }, [loadTasks, filters.search]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((task) => task.status !== "DONE").length,
      progress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      done: tasks.filter((task) => task.status === "DONE").length,
    }),
    [tasks],
  );

  async function mutate(
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await action();
      await loadTasks();
      setSuccess(successMessage);
      window.setTimeout(() => setSuccess(null), 3500);
    } catch (caught) {
      setError(messageOf(caught));
      throw caught;
    } finally {
      setBusy(false);
    }
  }

  async function saveTask(input: TaskInput) {
    if (editing) {
      await mutate(
        () => taskApi.update(editing.id, input),
        "Task updated successfully.",
      );
      setEditing(null);
    } else {
      await mutate(() => taskApi.create(input), "Task created successfully.");
    }
  }
  async function openHistory(task: Task) {
    setHistoryTask(task);
    setHistory(null);
    setHistoryError(null);
    await loadHistory(task);
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    try {
      await mutate(
        () => taskApi.update(task.id, { status }),
        status === "DONE" ? "Task completed." : "Task status updated.",
      );
    } catch {}
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`))
      return;
    try {
      await mutate(() => taskApi.delete(task.id), "Task deleted.");
      if (editing?.id === task.id) setEditing(null);
    } catch {}
  }

  async function loadHistory(task: Task) {
    try {
      const response = await taskApi.getHistory(task.id);
      setHistory(response.data as History[]);
    } catch (caught) {
      setHistoryError(messageOf(caught));
    }
  }
  const hasFilters = Boolean(
    filters.search || filters.status !== "ALL" || filters.priority !== "ALL",
  );

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ClipboardCheck className="size-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Taskflow</p>
              <p className="text-xs text-muted-foreground">
                Make progress visible.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => void onLogout()}>
              <LogOut className="size-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
            Today&apos;s focus
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Plan clearly. Finish confidently.
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Keep priorities, deadlines, and progress together in one quiet
            workspace.
          </p>
        </div>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Visible tasks",
              value: stats.total,
              Icon: ListTodo,
              style: "text-slate-600 bg-slate-100",
            },
            {
              label: "Still active",
              value: stats.active,
              Icon: TimerReset,
              style: "text-blue-700 bg-blue-50",
            },
            {
              label: "In progress",
              value: stats.progress,
              Icon: RefreshCw,
              style: "text-amber-700 bg-amber-50",
            },
            {
              label: "Completed",
              value: stats.done,
              Icon: CheckCircle2,
              style: "text-emerald-700 bg-emerald-50",
            },
          ].map(({ label, value, Icon, style }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`grid size-9 place-items-center rounded-xl ${style}`}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {success && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            <CheckCircle2 className="size-4" />
            {success}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLoading(true);
                void loadTasks();
              }}
            >
              Retry
            </Button>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="mb-4 grid gap-3 rounded-2xl border bg-white/70 p-3 shadow-sm sm:grid-cols-[1fr_160px_150px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 shadow-none"
                  placeholder="Search tasks…"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((current) => ({
                      ...current,
                      search: e.target.value,
                    }))
                  }
                />
              </div>
              <Select
                aria-label="Filter by status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    status: e.target.value as TaskStatus | "ALL",
                  }))
                }
              >
                <option value="ALL">All statuses</option>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
              <Select
                aria-label="Filter by priority"
                value={filters.priority}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    priority: e.target.value as TaskPriority | "ALL",
                  }))
                }
              >
                <option value="ALL">All priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-40 w-full" />
                ))}
              </div>
            ) : tasks.length ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    busy={busy}
                    onEdit={setEditing}
                    onDelete={deleteTask}
                    onStatusChange={changeStatus}
                    onHistoryClick={openHistory}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="grid min-h-72 place-items-center p-8 text-center">
                  <div>
                    <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                      <ListTodo className="size-5" />
                    </div>
                    <h2 className="font-semibold">
                      {hasFilters ? "No matching tasks" : "Your list is ready"}
                    </h2>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                      {hasFilters
                        ? "Adjust your filters or search for something else."
                        : "Add your first task to start turning plans into progress."}
                    </p>
                    {hasFilters && (
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() =>
                          setFilters({
                            search: "",
                            status: "ALL",
                            priority: "ALL",
                          })
                        }
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
          <TaskForm
            key={editing?.id ?? "new"}
            task={editing}
            busy={busy}
            onSubmit={saveTask}
            onCancel={() => setEditing(null)}
          />
        </div>
      </main>
      <Dialog
        open={historyTask !== null} // terbuka kalau ada task yang dipilih
        onOpenChange={(open) => {
          if (!open) setHistoryTask(null); // diminta tutup → kosongkan pilihan
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Riwayat: {historyTask?.title}</DialogTitle>
          </DialogHeader>

          {historyError ? (
            <p className="text-red-500">{historyError}</p>
          ) : history === null ? (
            <p>Memuat…</p>
          ) : history.length === 0 ? (
            <p>Belum ada riwayat.</p>
          ) : (
            <ul>
              {" "}
              {history.map((item) => (
                <li key={item.id}>
                  {item.action}
                  <br />
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(item?.createdAt))}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
