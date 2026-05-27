import "dotenv/config";
import app from "./app";
import { ensureAuthTokenConfig } from "./lib/auth-token";

const rawPort = Number.parseInt(process.env.PORT ?? "3001", 10);
const PORT = Number.isNaN(rawPort) ? 3001 : rawPort;
ensureAuthTokenConfig();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});