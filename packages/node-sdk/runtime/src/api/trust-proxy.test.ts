import { describe, expect, test } from "bun:test";
import { parseTrustProxy } from "./http-server.ts";

describe("parseTrustProxy", () => {
  test("defaults to trusting every hop", () => {
    expect(parseTrustProxy(undefined)).toBe(true);
    expect(parseTrustProxy("")).toBe(true);
    expect(parseTrustProxy("true")).toBe(true);
    expect(parseTrustProxy("TRUE")).toBe(true);
    expect(parseTrustProxy("1")).toBe(true);
  });
  test("can be switched off", () => {
    expect(parseTrustProxy("false")).toBe(false);
    expect(parseTrustProxy("0")).toBe(false);
  });
  test("a bare number that is not 0/1 is treated as an address list entry", () => {
    expect(parseTrustProxy("2")).toEqual(["2"]);
  });
  test("a list becomes trimmed proxy addresses", () => {
    expect(parseTrustProxy(" 127.0.0.1, 10.0.0.0/8 ,")).toEqual(["127.0.0.1", "10.0.0.0/8"]);
  });
});
