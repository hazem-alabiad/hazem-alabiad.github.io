import { describe, it, expect } from "vitest";
import { OWNER_LOGIN, isAuthorized } from "./authors";

describe("authors gate", () => {
  it("only the owner login is authorized", () => {
    expect(isAuthorized({ login: "hazem-alabiad", email: null })).toBe(true);
    expect(isAuthorized({ login: "someone-else", email: null })).toBe(false);
  });

  it("OWNER_LOGIN is the site owner", () => {
    expect(OWNER_LOGIN).toBe("hazem-alabiad");
  });
});