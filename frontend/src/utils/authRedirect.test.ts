import {
  buildInternalPath,
  clearReturnTo,
  consumeReturnTo,
  getDefaultReturnPath,
  getReturnTo,
  sanitizeInternalReturnTo,
  saveReturnTo,
} from "./authRedirect";

describe("authRedirect", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("builds an internal path with search and hash", () => {
    expect(
      buildInternalPath({
        pathname: "/rooms/abc/join",
        search: "?source=invite",
        hash: "#step",
      }),
    ).toBe("/rooms/abc/join?source=invite#step");
  });

  it("sanitizes unsafe redirect targets", () => {
    expect(sanitizeInternalReturnTo("https://evil.example/rooms/abc")).toBeNull();
    expect(sanitizeInternalReturnTo("//evil.example/rooms/abc")).toBeNull();
    expect(sanitizeInternalReturnTo("/login")).toBeNull();
  });

  it("stores and consumes safe redirect targets", () => {
    saveReturnTo("/rooms/abc/join?source=invite");

    expect(getReturnTo()).toBe("/rooms/abc/join?source=invite");
    expect(consumeReturnTo()).toBe("/rooms/abc/join?source=invite");
    expect(getReturnTo()).toBeNull();
  });

  it("returns the default fallback path", () => {
    clearReturnTo();
    expect(getDefaultReturnPath()).toBe("/rooms");
  });
});
