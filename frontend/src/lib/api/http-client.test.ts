import { describe, expect, it } from "vitest";
import { ApiError, buildQueryString } from "./http-client";

describe("http-client", () => {
  describe("buildQueryString", () => {
    it("returns an empty string for no query at all", () => {
      expect(buildQueryString(undefined)).toBe("");
    });

    it("returns an empty string when every value is omitted/empty", () => {
      expect(buildQueryString({ search: undefined, status: null, notes: "" })).toBe("");
    });

    it("serializes present values, prefixed with '?'", () => {
      const qs = buildQueryString({ projectId: "proj_1", page: 2, active: true });
      expect(qs.startsWith("?")).toBe(true);
      expect(qs).toContain("projectId=proj_1");
      expect(qs).toContain("page=2");
      expect(qs).toContain("active=true");
    });

    it("omits undefined/null/empty-string keys while keeping the rest — never serializes the literal word 'undefined'", () => {
      const qs = buildQueryString({ search: undefined, projectId: "proj_1" });
      expect(qs).not.toContain("undefined");
      expect(qs).toBe("?projectId=proj_1");
    });
  });

  describe("ApiError", () => {
    it("is a real Error — .message works exactly like a plain thrown Error", () => {
      const error = new ApiError("Not found.", 404, { message: "Not found." });
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Not found.");
    });

    it("additionally carries the numeric status and parsed body for a caller that wants to branch on them", () => {
      const body = { message: "Unauthorized", code: "AUTH_REQUIRED" };
      const error = new ApiError("Unauthorized", 401, body);
      expect(error.status).toBe(401);
      expect(error.body).toBe(body);
    });

    it("uses status 0 to signal a request that never reached the server", () => {
      const error = new ApiError("Could not reach the server.", 0);
      expect(error.status).toBe(0);
    });
  });
});
