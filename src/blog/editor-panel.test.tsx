import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditorPanel } from "./editor-panel";
import type { BlogDraft } from "./editor";

const base: BlogDraft = {
  isNew: true, slug: "", path: "", title: "Untitled note", date: "2026-08-01",
  description: "", tags: [], accent: "amber", author: "hazem-alabiad", body: "# Hello world",
};

function setup(draft: BlogDraft = base, busy = false) {
  const onDraft = vi.fn();
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(<EditorPanel draft={draft} onDraft={onDraft} busy={busy} onSave={onSave} onCancel={onCancel} />);
  return { onDraft, onSave, onCancel };
}

describe("EditorPanel", () => {
  it("edits the title", () => {
    const { onDraft } = setup();
    fireEvent.change(screen.getByLabelText("Post title"), { target: { value: "New Title" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ title: "New Title" }));
  });

  it("edits the description and parses tags from the settings strip", () => {
    const { onDraft } = setup();
    fireEvent.change(screen.getByLabelText("Post description"), { target: { value: "A short note" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ description: "A short note" }));
    fireEvent.change(screen.getByLabelText("Tags"), { target: { value: "NLP, arabic ,  llms" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ tags: ["NLP", "arabic", "llms"] }));
  });

  it("edits slug, date and accent", () => {
    const { onDraft } = setup();
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "my-slug" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ slug: "my-slug" }));
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-01" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-09-01" }));
    fireEvent.change(screen.getByLabelText("Accent color"), { target: { value: "violet" } });
    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ accent: "violet" }));
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