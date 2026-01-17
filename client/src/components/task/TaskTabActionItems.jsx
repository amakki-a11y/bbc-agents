import React, { useMemo, useState } from "react";
import {
    createActionItem,
    updateActionItem,
    deleteActionItem,
    fetchTaskDetails,
} from "../../api/taskDetails";

/**
 * Props:
 * - taskId: number|string
 * - task: the current task details object
 * - onTaskRefresh: async function(taskId) => updates parent state with latest details
 *
 * Backend note:
 * action items come as `title` but UI calls it `content`.
 */
export default function TaskTabActionItems({ taskId, task, onTaskRefresh }) {
    const [newText, setNewText] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [creating, setCreating] = useState(false);

    const items = useMemo(() => {
        const raw = task?.actionItems || [];
        // In your response it looked like actionItems might be {} sometimes; normalize.
        return Array.isArray(raw) ? raw : Object.values(raw);
    }, [task]);

    async function refresh() {
        if (onTaskRefresh) return onTaskRefresh(taskId);
        // fallback if parent didn't provide refresh handler
        await fetchTaskDetails(taskId);
    }

    async function handleAdd(e) {
        e?.preventDefault?.();
        const text = newText.trim();
        if (!text) return;

        try {
            setCreating(true);
            await createActionItem(taskId, { content: text });
            setNewText("");
            await refresh(); // ensures Activity panel updates from backend
        } finally {
            setCreating(false);
        }
    }

    async function toggleComplete(item) {
        try {
            setBusyId(item.id);
            await updateActionItem(item.id, { is_complete: !item.is_complete });
            await refresh();
        } finally {
            setBusyId(null);
        }
    }

    async function saveEdit(item, nextTitle) {
        const text = (nextTitle || "").trim();
        if (!text || text === item.title) return;

        try {
            setBusyId(item.id);
            // backend expects `content` mapped to db field `title`
            await updateActionItem(item.id, { content: text });
            await refresh();
        } finally {
            setBusyId(null);
        }
    }

    async function remove(item) {
        const ok = window.confirm("Delete this action item?");
        if (!ok) return;

        try {
            setBusyId(item.id);
            await deleteActionItem(item.id);
            await refresh();
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Add */}
            <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
                <input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Add an action item…"
                    style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        outline: "none",
                    }}
                    disabled={creating}
                />
                <button
                    type="submit"
                    disabled={creating}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: "white",
                        cursor: creating ? "not-allowed" : "pointer",
                    }}
                >
                    {creating ? "Adding…" : "Add"}
                </button>
            </form>

            {/* List */}
            {items.length === 0 ? (
                <div style={{ color: "#6b7280", padding: "10px 0" }}>
                    No action items yet.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((item) => (
                        <ActionItemRow
                            key={item.id}
                            item={item}
                            disabled={busyId === item.id}
                            onToggle={() => toggleComplete(item)}
                            onSave={(next) => saveEdit(item, next)}
                            onDelete={() => remove(item)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ActionItemRow({ item, disabled, onToggle, onSave, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(item.title || "");

    // keep draft synced if parent refreshes
    React.useEffect(() => setDraft(item.title || ""), [item.title]);

    return (
        <div
            style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #eef2f7",
                background: "white",
            }}
        >
            <input
                type="checkbox"
                checked={!!item.is_complete}
                onChange={onToggle}
                disabled={disabled}
                style={{ width: 16, height: 16 }}
            />

            <div style={{ flex: 1 }}>
                {editing ? (
                    <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={async () => {
                            setEditing(false);
                            await onSave(draft);
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                setEditing(false);
                                await onSave(draft);
                            }
                            if (e.key === "Escape") {
                                setEditing(false);
                                setDraft(item.title || "");
                            }
                        }}
                        disabled={disabled}
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                        }}
                    />
                ) : (
                    <div
                        onDoubleClick={() => setEditing(true)}
                        style={{
                            cursor: "text",
                            textDecoration: item.is_complete ? "line-through" : "none",
                            color: item.is_complete ? "#6b7280" : "#111827",
                        }}
                        title="Double click to edit"
                    >
                        {item.title}
                    </div>
                )}
            </div>

            <button
                onClick={onDelete}
                disabled={disabled}
                style={{
                    border: "none",
                    background: "transparent",
                    cursor: disabled ? "not-allowed" : "pointer",
                    color: "#6b7280",
                }}
                title="Delete"
            >
                🗑️
            </button>
        </div>
    );
}
