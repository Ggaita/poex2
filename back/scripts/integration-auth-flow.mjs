import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://127.0.0.1:3001";
const STARTUP_TIMEOUT_MS = 20000;

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

const waitForServer = async () => {
  const start = Date.now();

  while (Date.now() - start < STARTUP_TIMEOUT_MS) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      if (response.status >= 400 && response.status < 500) {
        return;
      }
    } catch {
      // retry
    }

    await delay(300);
  }

  throw new Error("El servidor no inició a tiempo para la prueba de integración");
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

const run = async () => {
  let server;

  try {
    server = await startServer();

    const unique = Date.now();
    const registerPayload = {
      companyName: `Empresa Front Test ${unique}`,
      contactName: "Frontend Integration",
      email: `front-integration-${unique}@example.com`,
      phone: "1111111111",
      message: "Solicitud enviada desde test de integración"
    };

    const registered = await requestJson("/api/public/applications", {
      method: "POST",
      body: JSON.stringify(registerPayload)
    });

    assert(
      registered.status === 201,
      `Registro esperado 201 y obtuvo ${registered.status}`
    );
    assert(
      typeof registered.body?.data?.id === "number",
      "Registro no devolvió id de solicitud"
    );

    const adminLogin = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: process.env.SEED_ADMIN_EMAIL ?? "admin@poex.local",
        password: process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!",
        role: "admin"
      })
    });
    assert(
      adminLogin.status === 200,
      `Login admin esperado 200 y obtuvo ${adminLogin.status}`
    );
    assert(
      adminLogin.body?.data?.user?.role === "admin",
      "Login admin devolvió rol inválido"
    );
    assert(
      typeof adminLogin.body?.data?.token === "string" &&
        adminLogin.body.data.token.length > 0,
      "Login admin no devolvió token"
    );
    const adminToken = adminLogin.body.data.token;

    const adminUnauthorized = await requestJson("/api/admin/applications");
    assert(
      adminUnauthorized.status === 401,
      `Listado admin sin token esperado 401 y obtuvo ${adminUnauthorized.status}`
    );

    const adminAuthorized = await requestJson("/api/admin/applications", {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert(
      adminAuthorized.status === 200,
      `Listado admin con token esperado 200 y obtuvo ${adminAuthorized.status}`
    );

    const companyLogin = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: process.env.SEED_EMPRESA_EMAIL ?? "empresa@poex.local",
        password: process.env.SEED_EMPRESA_PASSWORD ?? "Empresa1234!",
        role: "empresa"
      })
    });
    assert(
      companyLogin.status === 200,
      `Login empresa esperado 200 y obtuvo ${companyLogin.status}`
    );
    assert(
      companyLogin.body?.data?.user?.role === "empresa",
      "Login empresa devolvió rol inválido"
    );

    const invalidLogin = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: process.env.SEED_ADMIN_EMAIL ?? "admin@poex.local",
        password: "incorrecta",
        role: "admin"
      })
    });
    assert(
      invalidLogin.status === 401,
      `Login inválido esperado 401 y obtuvo ${invalidLogin.status}`
    );

    console.log(
      "✅ Integración validada: registro y login autenticando contra PostgreSQL funcionan correctamente."
    );
  } finally {
    await stopServer(server);
  }
};

run().catch((error) => {
  console.error("❌ Falló la integración de registro/login:", error.message);
  process.exitCode = 1;
});
