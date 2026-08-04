"use client";

import { Edit3, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  deleteNotificationTemplate,
  fetchNotificationLog,
  fetchNotificationTemplates,
  saveNotificationTemplate,
  updateNotificationTemplate,
  type NotificationLogEntry,
  type NotificationTemplate,
} from "@/lib/notifications";
import { useAuthStore } from "@/stores/authStore";

const viewTabs = [
  { label: "Templates", value: "templates" },
  { label: "Delivery Log", value: "log" },
] as const;

type ViewTab = (typeof viewTabs)[number]["value"];

const blankForm = {
  active: true,
  body: "",
  channel: "email" as "email" | "whatsapp",
  eventType: "",
  subject: "",
};

export default function AdminNotificationsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [view, setView] = useState<ViewTab>("templates");
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NotificationTemplate>();

  async function loadTemplates() {
    setLoading(true);
    try {
      const payload = await fetchNotificationTemplates(accessToken);
      setTemplates(payload.templates);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load templates"));
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    setLoading(true);
    try {
      const payload = await fetchNotificationLog({}, accessToken);
      setLogs(payload.data);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load notification log"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    if (view === "templates") {
      void loadTemplates();
    } else {
      void loadLogs();
    }
  }, [accessToken, view]);

  function openCreate() {
    setEditingId(undefined);
    setForm(blankForm);
    setEditorOpen(true);
  }

  function openEdit(template: NotificationTemplate) {
    setEditingId(template._id);
    setForm({
      active: template.active,
      body: template.body,
      channel: template.channel,
      eventType: template.eventType,
      subject: template.subject ?? "",
    });
    setEditorOpen(true);
  }

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        active: form.active,
        body: form.body,
        channel: form.channel,
        eventType: form.eventType,
        subject: form.subject || undefined,
      };

      if (editingId) {
        await updateNotificationTemplate(editingId, payload, accessToken);
      } else {
        await saveNotificationTemplate(payload, accessToken);
      }

      toast.success("Notification template saved");
      setEditorOpen(false);
      await loadTemplates();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to save template"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteNotificationTemplate(deleteTarget._id, accessToken);
      toast.success("Template deleted");
      setDeleteTarget(undefined);
      await loadTemplates();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete template"));
    }
  }

  return (
    <ProtectedRoute>
      <section className="mx-auto max-w-7xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Admin-editable templates override the built-in transactional emails/WhatsApp messages
              for the same event and channel. Delivery log shows what was actually sent.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold"
              onClick={() => void (view === "templates" ? loadTemplates() : loadLogs())}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Refresh
            </button>
            {view === "templates" ? (
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                onClick={openCreate}
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
                New Template
              </button>
            ) : null}
          </div>
        </div>

        <Tabs active={view} items={viewTabs} onChange={setView} />

        <div className="mt-3">
          {view === "templates" ? (
            templates.length ? (
              <DataTable
                columns={[
                  { header: "Event Type", render: (item) => item.eventType },
                  { header: "Channel", render: (item) => item.channel },
                  {
                    header: "Subject",
                    render: (item) => item.subject ?? "-",
                  },
                  {
                    header: "Active",
                    render: (item) => (item.active ? "Yes" : "No"),
                  },
                  {
                    align: "right",
                    header: "Actions",
                    render: (item) => (
                      <div className="flex justify-end gap-1.5">
                        <button
                          className="inline-flex size-8 items-center justify-center rounded-md border border-border"
                          onClick={() => openEdit(item)}
                          title="Edit template"
                          type="button"
                        >
                          <Edit3 aria-hidden="true" size={14} />
                        </button>
                        <button
                          className="inline-flex size-8 items-center justify-center rounded-md border border-border text-destructive"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete template"
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={14} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                emptyMessage={loading ? "Loading..." : "No templates yet."}
                getRowKey={(item) => item._id}
                rows={templates}
              />
            ) : (
              <EmptyState
                title="No admin templates"
                message={
                  loading
                    ? "Loading..."
                    : "Every transactional event currently falls back to its built-in template. Create one here to override it."
                }
              />
            )
          ) : logs.length ? (
            <DataTable
              columns={[
                { header: "Event Type", render: (item) => item.eventType },
                { header: "Channel", render: (item) => item.channel },
                { header: "To", render: (item) => item.to },
                { header: "Status", render: (item) => item.status },
                {
                  header: "Sent At",
                  render: (item) => new Date(item.createdAt).toLocaleString(),
                },
              ]}
              emptyMessage={loading ? "Loading..." : "No notifications yet."}
              getRowKey={(item) => item._id}
              rows={logs}
            />
          ) : (
            <EmptyState
              title="No delivery log"
              message={loading ? "Loading..." : "Sent notifications will appear here."}
            />
          )}
        </div>

        <Modal
          onClose={() => setEditorOpen(false)}
          open={editorOpen}
          size="lg"
          title={editingId ? "Edit template" : "Create template"}
        >
          <form onSubmit={saveTemplate}>
            <div className="grid gap-3">
              <Field
                label="Event type"
                onChange={(value) => setForm((current) => ({ ...current, eventType: value }))}
                required
                value={form.eventType}
              />
              <Select
                label="Channel"
                onChange={(value) =>
                  setForm((current) => ({ ...current, channel: value as "email" | "whatsapp" }))
                }
                options={[
                  { label: "Email", value: "email" },
                  { label: "WhatsApp", value: "whatsapp" },
                ]}
                value={form.channel}
              />
              <Field
                label="Subject (email only)"
                onChange={(value) => setForm((current) => ({ ...current, subject: value }))}
                value={form.subject}
              />
              <Textarea
                helperText="Use {{placeholder}} tokens, e.g. {{orderNumber}}, {{code}}, {{trackUrl}}."
                label="Body"
                onChange={(value) => setForm((current) => ({ ...current, body: value }))}
                required
                rows={8}
                value={form.body}
              />
              <Checkbox
                checked={form.active}
                label="Active (overrides the built-in template when on)"
                onChange={(value) => setForm((current) => ({ ...current, active: value }))}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
              <button
                className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
                disabled={saving}
                onClick={() => setEditorOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          confirmLabel="Delete"
          message={`This will remove the admin override for "${deleteTarget?.eventType}" (${deleteTarget?.channel}). The built-in template will be used again.`}
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={confirmDelete}
          open={!!deleteTarget}
          title="Delete template"
        />
      </section>
    </ProtectedRoute>
  );
}
