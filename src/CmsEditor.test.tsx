import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CmsEditor from "./CmsEditor";
import { DEFAULT_CONTENT } from "./cms";

function setup(overrides = {}) {
  const onSave = vi.fn();
  const onReset = vi.fn();
  const onClose = vi.fn();
  render(<CmsEditor initial={DEFAULT_CONTENT} onSave={onSave} onReset={onReset} onClose={onClose} {...overrides} />);
  return { onSave, onReset, onClose };
}

describe("CmsEditor", () => {
  it("renders the editor shell with the initial content and verified banner", () => {
    setup();
    expect(screen.getByRole("heading", { name: /edit portfolio/i })).toBeInTheDocument();
    expect(screen.getByText(/VERIFIED — READ\/WRITE ACCESS/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(DEFAULT_CONTENT.heroTagline)).toBeInTheDocument();
    expect(screen.getByDisplayValue(DEFAULT_CONTENT.footerLine)).toBeInTheDocument();
  });

  it("edits fields and saves the updated content", () => {
    const { onSave } = setup();
    fireEvent.change(screen.getByDisplayValue(DEFAULT_CONTENT.heroTagline), { target: { value: "New tagline" } });
    fireEvent.change(screen.getByDisplayValue(DEFAULT_CONTENT.footerLine), { target: { value: "custom footer" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0] as typeof DEFAULT_CONTENT;
    expect(saved.heroTagline).toBe("New tagline");
    expect(saved.footerLine).toBe("custom footer");
    expect(saved.experience.length).toBe(DEFAULT_CONTENT.experience.length);
    expect(screen.getByRole("button", { name: /saved/i })).toBeInTheDocument();
  });

  it("closes via the close button", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByTitle("Close editor"));
    expect(onClose).toHaveBeenCalled();
  });

  it("resets after confirmation", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { onReset, onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("skips the reset when confirmation is declined", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { onReset } = setup();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).not.toHaveBeenCalled();
  });

  it("fetches and matches GitHub repo links", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true, status: 200,
      json: async () => [{ name: "MWE", html_url: "https://github.com/hazem-alabiad/MWE", description: "multiword expressions" }],
    })));
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("button", { name: /fetch links from github/i }));
    await waitFor(() => expect(screen.getByText(/matched 1\/4 repos/)).toBeInTheDocument());
    // the matched project got its link updated
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    const saved = onSave.mock.calls[0][0] as typeof DEFAULT_CONTENT;
    expect(saved.projects.find((p) => p.name === "Multiword Expressions in Arabic")!.link).toBe("https://github.com/hazem-alabiad/MWE");
    vi.unstubAllGlobals();
  });

  it("reports GitHub API failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ message: "rate limited" }) })));
    setup();
    fireEvent.click(screen.getByRole("button", { name: /fetch links from github/i }));
    await waitFor(() => expect(screen.getByText(/✗ rate limited/)).toBeInTheDocument());
    vi.unstubAllGlobals();
  });

  it("adds education and experience entries", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("button", { name: /add education/i }));
    fireEvent.click(screen.getByRole("button", { name: /add experience/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    const saved = onSave.mock.calls[0][0] as typeof DEFAULT_CONTENT;
    expect(saved.education.length).toBe(DEFAULT_CONTENT.education.length + 1);
    expect(saved.experience.length).toBe(DEFAULT_CONTENT.experience.length + 1);
  });

  it("uploads and removes a custom photo", async () => {
    setup();
    const fileInput = document.getElementById("cms-photo") as HTMLInputElement;
    const file = new File(["abc"], "portrait.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText("REPLACE IMG")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /remove custom photo/i }));
    expect(screen.getByText("UPLOAD IMG")).toBeInTheDocument();
  });
});