import "dotenv/config";
import { createServer } from "./index.js";

const app = createServer();
const port = 8080;

app.listen(port, () => {
  console.log(`🚀 API Server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
