import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { GET, POST } from "../app/api/creator-applications/route";

test("creator API distinguishes existing applications, duplicate races, and lookup failures", async () => {
  let scenario = "existing";
  let inserts = 0;
  const server = createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    if (request.method === "GET") {
      assert.match(decodeURIComponent(request.url ?? ""), /email=ilike\.creator@example\.test/);
      if (scenario === "lookup-error") {
        response.writeHead(500);
        response.end(JSON.stringify({ code: "XX000", message: "Lookup failed" }));
      } else {
        response.end(JSON.stringify(scenario === "existing" ? { id: "existing-id" } : null));
      }
    } else {
      inserts++;
      response.writeHead(409);
      response.end(JSON.stringify({ code: "23505", message: "Duplicate email" }));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${address.port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  try {
    for (const current of ["existing", "race", "lookup-error"]) {
      scenario = current;
      const response = await POST(new Request("http://localhost/api/creator-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `test-${current}` },
        body: JSON.stringify({ email: " Creator@Example.test ", method: "manual", holdingsText: "INFY, 100%" }),
      }));
      const body = await response.json();
      assert.equal(response.status, current === "lookup-error" ? 503 : 409);
      assert.equal(body.stored, false);
      if (current !== "lookup-error") assert.equal(body.code, "APPLICATION_EXISTS");
      assert.equal(body.status, undefined);
    }
    assert.equal(inserts, 1, "existing applications and failed lookups must not write");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonymous = await GET();
    assert.equal(anonymous.status, 401);
    assert.equal(anonymous.headers.get("Cache-Control"), "no-store");
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
