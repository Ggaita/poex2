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

const loginAsAdmin = async () => {
  const login = await requestJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@poex.local",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!",
      role: "admin"
    })
  });

  assert(login.status === 200, `Login admin esperado 200 y obtuvo ${login.status}`);
  const token = login.body?.data?.token;
  const displayName = login.body?.data?.user?.displayName;
  assert(
    typeof token === "string" && token.length > 0,
    "No se obtuvo token válido para pruebas admin"
  );
  assert(
    typeof displayName === "string" && displayName.length > 0,
    "No se obtuvo displayName admin para validar reviewedBy"
  );

  return { token, displayName };
};

const run = async () => {
  let server;

  try {
    server = await startServer();

    const unique = Date.now();
    const payload = {
      companyName: `Empresa Test ${unique}`,
      contactName: "Integration Bot",
      email: `integration-${unique}@example.com`,
      phone: "1111111111",
      taxId: `TAX-${unique}`,
      message: "Alta para prueba de integración"
    };

    const created = await requestJson("/api/public/applications", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    assert(created.status === 201, `POST esperado 201 y obtuvo ${created.status}`);
    const applicationId = created.body?.data?.id;
    assert(
      typeof applicationId === "number",
      "La respuesta de creación no devolvió un id numérico"
    );
    const unauthorized = await requestJson("/api/admin/applications");
    assert(
      unauthorized.status === 401,
      `GET admin sin token esperado 401 y obtuvo ${unauthorized.status}`
    );

    const adminSession = await loginAsAdmin();

    const listed = await requestJson("/api/admin/applications", {
      headers: {
        Authorization: `Bearer ${adminSession.token}`
      }
    });
    assert(listed.status === 200, `GET listado esperado 200 y obtuvo ${listed.status}`);
    const existsInList = Array.isArray(listed.body?.data)
      ? listed.body.data.some((item) => item.id === applicationId)
      : false;
    assert(existsInList, "La solicitud creada no apareció en el listado admin");

    const reviewed = await requestJson(
      `/api/admin/applications/${applicationId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminSession.token}`
        },
        body: JSON.stringify({
          status: "approved",
          reviewedBy: "integration-test"
        })
      }
    );
    assert(reviewed.status === 200, `PATCH esperado 200 y obtuvo ${reviewed.status}`);
    assert(
      reviewed.body?.data?.status === "approved",
      "La solicitud no quedó en estado approved tras el PATCH"
    );

    await stopServer(server);
    server = await startServer();
    const adminSessionAfterRestart = await loginAsAdmin();
    const afterRestart = await requestJson(`/api/admin/applications/${applicationId}`, {
      headers: {
        Authorization: `Bearer ${adminSessionAfterRestart.token}`
      }
    });
    assert(
      afterRestart.status === 200,
      `GET post-restart esperado 200 y obtuvo ${afterRestart.status}`
    );
    assert(
      afterRestart.body?.data?.status === "approved",
      "El estado approved no persistió luego de reiniciar el servidor"
    );
    assert(
      afterRestart.body?.data?.reviewedBy === adminSessionAfterRestart.displayName,
      "El reviewedBy no persistió luego de reiniciar el servidor"
    );

    console.log(
      "✅ Integración validada: create/list/update/get persiste correctamente incluso tras reinicio."
    );
  } finally {
    await stopServer(server);
  }
};

run().catch((error) => {
  console.error("❌ Falló la prueba de integración:", error.message);
  process.exitCode = 1;
});