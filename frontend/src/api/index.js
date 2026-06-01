import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 12000,
});

// Normalize array safely
const arr = (v) => (Array.isArray(v) ? v : []);

export const api = {
  getSummary:  () => client.get("/summary").then((r) => arr(r.data.summary ?? r.data)),
  getExpenses: () => client.get("/expenses").then((r) => arr(r.data.expenses ?? r.data)),
  getBudgets:  () => client.get("/budgets").then((r) => arr(r.data.budgets ?? r.data)),
  postWebhook: (body) => client.post("/webhook", body).then((r) => r.data),
};