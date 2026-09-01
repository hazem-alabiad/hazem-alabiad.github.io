import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageLoader } from "./PageLoader";

describe("PageLoader", () => {
  it("announces loading via role=status and shows the default label", () => {
    render(<PageLoader />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("loading");
    expect(status.querySelector(".page-loader-prompt")).toHaveTextContent("$");
    expect(status.querySelector(".page-loader-cursor")).not.toBeNull();
  });

  it("renders a custom label", () => {
    render(<PageLoader label="loading notes" />);
    expect(screen.getByRole("status")).toHaveTextContent("loading notes");
  });
});