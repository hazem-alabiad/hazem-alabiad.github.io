import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditorPanel } from "./editor-panel";
import type { BlogDraft } from "./editor";

const base: BlogDraft = {
  isNew: true, slug: "", path: "", title: "Untitled note", date: "2026-08-01",
  description: "", tags: [], accent: "amber", author: "hazem-alabiad", body: "# Hello world",
};

function setup(draft: BlogDraft = base, busy = false) {
  let current = draft;
  const onSave = vi.fn();
  const onCancel = vi.fn();
  const onDraft = vi.fn((d: BlogDraft) => {
    current = d;
    rerender(<EditorPanel draft={current} onDraft={onDraft} busy={busy} onSave={onSave} onCancel={onCancel} />);
  });
  const { rerender } = render(<EditorPanel draft={draft} onDraft={onDraft} busy={busy} onSave={onSave} onCancel={onCancel} />);
  return { onDraft, onSave, onCancel };
}

describe("EditorPanel", () => {
  it("edits the title", () => {
    const { onDraft } = setup();
    fireEvent.change(screen.getByLabelText("Post title"), { target: { value: "New Title" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ title: "New Title" }));
  });

  it("edits the description", () => {
    const { onDraft } = setup();
    fireEvent.change(screen.getByLabelText("Post description"), { target: { value: "A short note" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ description: "A short note" }));
  });

  it("adds tags as chips and removes them", () => {
    const { onDraft } = setup();
    const tags = screen.getByLabelText("Tags");
    fireEvent.change(tags, { target: { value: "NLP" } });
    fireEvent.keyDown(tags, { key: "Enter" });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ tags: ["NLP"] }));
    fireEvent.change(tags, { target: { value: "arabic" } });
    fireEvent.keyDown(tags, { key: "Enter" });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ tags: ["NLP", "arabic"] }));
    expect(screen.getByRole("button", { name: "Remove tag NLP" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove tag NLP" }));
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ tags: ["arabic"] }));
  });

  it("has no slug or URI surface in the editor", () => {
    setup();
    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/post link/i)).not.toBeInTheDocument();
    expect(screen.queryByText("/blog/")).not.toBeInTheDocument();
    // date + tags remain the only metadata fields
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Tags")).toBeInTheDocument();
  });

  it("derives the post URI from the title when saving", () => {
    const { onDraft } = setup();
    fireEvent.change(screen.getByLabelText("Post title"), { target: { value: "My New Note!" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-01" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ title: "My New Note!" }));
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-09-01" }));
  });

  it("edits the date through the native date input only", () => {
    const { onDraft } = setup();
    // the calendar is the native one — no custom display, icon, or echo
    const date = screen.getByLabelText("Date");
    expect(date.getAttribute("type")).toBe("date");
    fireEvent.change(date, { target: { value: "2026-09-01" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-09-01" }));
  });

  it("keeps the markdown body in sync through the editor", () => {
    const { onDraft } = setup();
    const editor = screen.getByLabelText("Post body (markdown)");
    fireEvent.change(editor, { target: { value: "# Better" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ body: "# Better" }));
  });

  it("computes the word count and reading time", () => {
    setup({ ...base, body: "one two three four five" });
    expect(screen.getByText(/5 words · ~1 min read/i)).toBeInTheDocument();
  });

  it("shows PUBLISH POST for new drafts and SAVE POST for edits", () => {
    setup();
    expect(screen.getByRole("button", { name: /publish post/i })).toBeInTheDocument();
    setup({ ...base, isNew: false, slug: "old" });
    expect(screen.getByRole("button", { name: /save post/i })).toBeInTheDocument();
  });

  it("cancels through the CANCEL button", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows SAVING… and disables the actions while busy", () => {
    const { onSave } = setup(base, true);
    expect(screen.getByRole("button", { name: /saving…/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });
});