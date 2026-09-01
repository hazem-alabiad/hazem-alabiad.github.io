import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Comments, GISCUS_CONFIG } from "./Comments";

vi.mock("@giscus/react", () => ({ default: (props: Record<string, string>) => <div data-testid="giscus" data-repo={props.repo} data-repo-id={props.repoId} data-category-id={props.categoryId} data-term={props.term} data-reactions={props.reactionsEnabled} /> }));

describe("Comments", () => {
  it("uses the verified giscus repository, category, reactions, and slug mapping", () => {
    render(<Comments slug="arabic-vmwe-llms" />);
    const widget = screen.getByTestId("giscus");
    expect(widget).toHaveAttribute("data-repo", GISCUS_CONFIG.repo);
    expect(widget).toHaveAttribute("data-repo-id", GISCUS_CONFIG.repoId);
    expect(widget).toHaveAttribute("data-category-id", GISCUS_CONFIG.categoryId);
    expect(widget).toHaveAttribute("data-term", "arabic-vmwe-llms");
    expect(widget).toHaveAttribute("data-reactions", "1");
  });

  it("provides a clear GitHub management action for the current post", () => {
    render(<Comments slug="arabic-vmwe-llms" />);
    const link = screen.getByRole("link", { name: /manage your comments on github/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.getAttribute("href")).toContain("discussions_q=arabic-vmwe-llms");
  });
});
