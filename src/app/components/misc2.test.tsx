import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContactForm } from "./ContactForm";
import { UniCrest } from "./UniCrest";

afterEach(() => vi.restoreAllMocks());

describe("ContactForm", () => {
  it("opens a mailto link built from the fields and shows the sent state", () => {
    const hrefSetter = vi.fn();
    Object.defineProperty(window, "location", { value: { set href(v: string) { hrefSetter(v); } }, configurable: true, writable: true });
    render(<ContactForm email="me@example.com" />);
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Your email"), { target: { value: "ada@x.io" } });
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Hello" } });
    fireEvent.change(screen.getByLabelText("Your message…"), { target: { value: "Nice site" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(hrefSetter).toHaveBeenCalledWith(
      expect.stringContaining("me@example.com?subject=Hello&body=Name%3A%20Ada%0AFrom%3A%20ada%40x.io%0A%0ANice%20site")
    );
    expect(screen.getByRole("button", { name: /opening your email client/i })).toBeInTheDocument();
  });

  it("defaults the subject when left empty", () => {
    const hrefSetter = vi.fn();
    Object.defineProperty(window, "location", { value: { set href(v: string) { hrefSetter(v); } }, configurable: true, writable: true });
    render(<ContactForm email="me@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(hrefSetter).toHaveBeenCalledWith(expect.stringContaining("subject=Hello%20Hazem"));
  });
});

describe("UniCrest", () => {
  it("uses the Tübingen palette for Tübingen schools", () => {
    render(<UniCrest school="University of Tübingen" />);
    const rect = document.querySelector("rect");
    expect(rect!.getAttribute("fill")).toBe("#7CC4A8");
    expect(document.querySelector("text")!.textContent).toBe("T");
  });

  it("uses the default palette and first letter for other schools", () => {
    render(<UniCrest school="Hacettepe University" size={32} />);
    expect(document.querySelector("rect")!.getAttribute("fill")).toBe("#0E4C92");
    expect(document.querySelector("text")!.textContent).toBe("H");
  });
});