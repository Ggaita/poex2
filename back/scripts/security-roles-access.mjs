/**
 * Security tests: authentication + role-based access on protected routes.
 *
 * Covers:
 * - Admin routes reject anonymous / invalid token / empresa role
 * - Company routes reject anonymous / invalid token / admin role
 * - Valid role can access its own protected surface
 * - Public routes remain reachable without auth
 *
 * Requires seed users (npm run seed:auth-users) and a built server (npm run build).
 */
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://127.0.0.1:3001";
const STARTUP_TIMEOUT_MS = 20000;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@poex.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
const EMPRESA_EMAIL = process.env.SEED_EMPRESA_EMAIL ?? "empresa@poex.local";
const EMPRESA_PASSWORD = process.env.SEED_EMPRESA_PASSWORD ?? "Empresa1234!";

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const bodyText = await response.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  return { status: response.status, body };
};

const authHeader = (token) =>
  token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};

const waitForServer = async () => {
  const start = Date.now();

  while (Date.now() - start < STARTUP_TIMEOUT_MS) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (response.status >= 400 && response.status < 500) {
        return;
      }
    } catch {
      // retry until timeout
    }

    await delay(300);
  }

  throw new Error("El servidor no inició a tiempo para los tests de seguridad");
};

const startServer = async () => {
  const server = spawn(process.execPath, ["dist/server.js"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout.on("data", (chunk) => {
    process.stdout.write(`[server] ${chunk}`);
  });
  server.stderr.on("data", (chunk) => {
    process.stderr.write(`[server] ${chunk}`);
  });

  await waitForServer();
  return server;
};

const stopServer = async (server) => {
  if (!server || server.killed) {
    return;
  }
  server.kill();
  await delay(500);
};

const login = async (email, password, role) => {
  const result = await requestJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role })
  });

  assert(
    result.status === 200,
    `Login ${role} esperado 200 y obtuvo ${result.status}`
  );
  assert(
    result.body?.data?.user?.role === role,
    `Login ${role} devolvió rol inesperado: ${result.body?.data?.user?.role}`
  );

  const token = result.body?.data?.token;
  assert(typeof token === "string" && token.length > 0, `Login ${role} sin token`);
  return token;
};

/**
 * Matrix of protected endpoints to exercise authz.
 * expectedOk: HTTP status accepted when the correct role is used.
 */
const adminRoutes = [
  { method: "GET", path: "/api/admin/applications", expectedOk: 200 },
  { method: "GET", path: "/api/admin/applications/pending-count", expectedOk: 200 },
  { method: "GET", path: "/api/admin/profiles", expectedOk: 200 },
  { method: "GET", path: "/api/admin/communications/templates", expectedOk: 200 },
  { method: "GET", path: "/api/admin/communications/outbox", expectedOk: 200 },
  { method: "GET", path: "/api/admin/special-requests", expectedOk: 200 },
  { method: "GET", path: "/api/admin/special-requests/pending-count", expectedOk: 200 }
];

const companyRoutes = [
  { method: "GET", path: "/api/company/profile/me", expectedOk: [200, 404] }
];

const publicRoutes = [
  { method: "GET", path: "/api/public/profiles", expectedOk: 200 },
  { method: "GET", path: "/api/search?q=miel&mode=product", expectedOk: 200 }
];

const callRoute = async (route, token) => {
  return requestJson(route.path, {
    method: route.method,
    headers: authHeader(token)
  });
};

const expectStatus = (actual, expected, label) => {
  const allowed = Array.isArray(expected) ? expected : [expected];
  assert(
    allowed.includes(actual),
    `${label}: esperado ${allowed.join("|")} y obtuvo ${actual}`
  );
};

const runCase = async (name, fn) => {
  process.stdout.write(`  • ${name} ... `);
  await fn();
  console.log("OK");
};

const run = async () => {
  let server;
  let passed = 0;

  try {
    server = await startServer();

    console.log("🔐 Security roles & protected routes\n");

    const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD, "admin");
    const empresaToken = await login(EMPRESA_EMAIL, EMPRESA_PASSWORD, "empresa");
    const garbageToken = "not-a-jwt.token.value";
    // Well-formed JWT shape but wrong signature / payload
    const forgedToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYXR0YWNrZXJAcG9leC5sb2NhbCJ9." +
      "invalidsignature";

    // --- Anonymous on admin ---
    for (const route of adminRoutes) {
      await runCase(`anon → ${route.method} ${route.path} = 401`, async () => {
        const res = await callRoute(route);
        expectStatus(res.status, 401, `anon ${route.path}`);
        assert(res.body?.success === false, `anon ${route.path}: success debería ser false`);
      });
      passed += 1;
    }

    // --- Invalid / forged tokens on admin ---
    for (const route of adminRoutes.slice(0, 2)) {
      await runCase(`token basura → ${route.path} = 401`, async () => {
        const res = await callRoute(route, garbageToken);
        expectStatus(res.status, 401, `garbage ${route.path}`);
      });
      passed += 1;

      await runCase(`token falsificado → ${route.path} = 401`, async () => {
        const res = await callRoute(route, forgedToken);
        expectStatus(res.status, 401, `forged ${route.path}`);
      });
      passed += 1;
    }

    // --- Empresa cannot access admin ---
    for (const route of adminRoutes) {
      await runCase(`empresa → ${route.method} ${route.path} = 403`, async () => {
        const res = await callRoute(route, empresaToken);
        expectStatus(res.status, 403, `empresa→admin ${route.path}`);
        assert(
          res.body?.success === false,
          `empresa→admin ${route.path}: success debería ser false`
        );
      });
      passed += 1;
    }

    // --- Admin can access admin ---
    for (const route of adminRoutes) {
      await runCase(`admin → ${route.method} ${route.path} = OK`, async () => {
        const res = await callRoute(route, adminToken);
        expectStatus(res.status, route.expectedOk, `admin ${route.path}`);
        assert(res.body?.success === true, `admin ${route.path}: success debería ser true`);
      });
      passed += 1;
    }

    // --- Anonymous on company ---
    for (const route of companyRoutes) {
      await runCase(`anon → ${route.method} ${route.path} = 401`, async () => {
        const res = await callRoute(route);
        expectStatus(res.status, 401, `anon company ${route.path}`);
      });
      passed += 1;
    }

    // --- Admin cannot use company panel routes ---
    for (const route of companyRoutes) {
      await runCase(`admin → ${route.method} ${route.path} = 403`, async () => {
        const res = await callRoute(route, adminToken);
        expectStatus(res.status, 403, `admin→company ${route.path}`);
      });
      passed += 1;
    }

    // --- Empresa can hit company routes (200 if profile exists, 404 if not linked yet) ---
    for (const route of companyRoutes) {
      await runCase(
        `empresa → ${route.method} ${route.path} = ${[].concat(route.expectedOk).join("|")}`,
        async () => {
          const res = await callRoute(route, empresaToken);
          expectStatus(res.status, route.expectedOk, `empresa ${route.path}`);
          // 404 is acceptable when seed empresa has no owned profile yet
          if (res.status === 200) {
            assert(res.body?.success === true, `empresa ${route.path}: success true esperado`);
          } else if (res.status === 404) {
            assert(res.body?.success === false, `empresa ${route.path}: 404 debe ser success false`);
          }
        }
      );
      passed += 1;
    }

    // --- Empresa token with wrong Authorization scheme ---
    await runCase("admin route con scheme Basic = 401", async () => {
      const res = await requestJson("/api/admin/applications", {
        headers: {
          Authorization: `Basic ${adminToken}`
        }
      });
      expectStatus(res.status, 401, "Basic scheme");
    });
    passed += 1;

    await runCase("admin route sin Bearer prefix = 401", async () => {
      const res = await requestJson("/api/admin/applications", {
        headers: {
          Authorization: adminToken
        }
      });
      expectStatus(res.status, 401, "missing Bearer");
    });
    passed += 1;

    // --- Public routes stay open ---
    for (const route of publicRoutes) {
      await runCase(`público → ${route.method} ${route.path}`, async () => {
        const res = await callRoute(route);
        expectStatus(res.status, route.expectedOk, `public ${route.path}`);
      });
      passed += 1;
    }

    // --- Login role mismatch: empresa credentials with role=admin must fail ---
    await runCase("credenciales empresa + role admin = 401", async () => {
      const res = await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: EMPRESA_EMAIL,
          password: EMPRESA_PASSWORD,
          role: "admin"
        })
      });
      expectStatus(res.status, 401, "role mismatch login");
    });
    passed += 1;

    await runCase("credenciales admin + role empresa = 401", async () => {
      const res = await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          role: "empresa"
        })
      });
      expectStatus(res.status, 401, "admin as empresa login");
    });
    passed += 1;

    // Mutating admin endpoints without auth (spot-check)
    await runCase("POST /api/admin/profiles sin token = 401", async () => {
      const res = await requestJson("/api/admin/profiles", {
        method: "POST",
        body: JSON.stringify({
          companyName: "Hack SA",
          contactName: "No",
          contactEmail: "no@example.com"
        })
      });
      expectStatus(res.status, 401, "POST admin profiles anon");
    });
    passed += 1;

    await runCase("POST /api/admin/profiles con empresa = 403", async () => {
      const res = await requestJson("/api/admin/profiles", {
        method: "POST",
        headers: authHeader(empresaToken),
        body: JSON.stringify({
          companyName: "Hack SA",
          contactName: "No",
          contactEmail: "no@example.com"
        })
      });
      expectStatus(res.status, 403, "POST admin profiles empresa");
    });
    passed += 1;

    await runCase("PATCH company profile con admin = 403", async () => {
      const res = await requestJson("/api/company/profile/me", {
        method: "PATCH",
        headers: authHeader(adminToken),
        body: JSON.stringify({ description: "no debería poder" })
      });
      expectStatus(res.status, 403, "PATCH company as admin");
    });
    passed += 1;

    console.log(`\n✅ Security roles/access: ${passed} checks OK`);
  } finally {
    await stopServer(server);
  }
};

run().catch((error) => {
  console.error("\n❌ Falló security-roles-access:", error.message);
  process.exitCode = 1;
});
