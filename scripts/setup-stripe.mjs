/**
 * Создаёт Product + Price ($5/мес) в Stripe (test mode).
 * Запуск: node scripts/setup-stripe.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(envPath);

const secret = process.env.STRIPE_SECRET_KEY?.trim();
if (!secret) {
  console.error("STRIPE_SECRET_KEY не задан в .env.local");
  process.exit(1);
}

const stripe = new Stripe(secret);
const PRODUCT_NAME = "Money Tracker — RUB/KZT конвертация";
const LOOKUP_KEY = "money_tracker_rub_kzt_monthly";

async function findOrCreatePrice() {
  const existing = await stripe.prices.list({
    lookup_keys: [LOOKUP_KEY],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) {
    return existing.data[0];
  }

  const products = await stripe.products.list({ active: true, limit: 100 });
  let product = products.data.find((p) => p.name === PRODUCT_NAME);
  if (!product) {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description:
        "Отображение сумм в российских рублях и тенге ($5/мес)",
    });
    console.log("Создан продукт:", product.id);
  }

  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: 500,
    recurring: { interval: "month" },
    lookup_key: LOOKUP_KEY,
  });
  console.log("Создана цена:", price.id);
  return price;
}

function upsertEnvVar(path, key, value) {
  let text = existsSync(path) ? readFileSync(path, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) {
    text = text.replace(re, line);
  } else {
    if (text.length && !text.endsWith("\n")) text += "\n";
    text += `\n# Stripe (setup-stripe.mjs)\n${line}\n`;
  }
  writeFileSync(path, text, "utf8");
}

const price = await findOrCreatePrice();
upsertEnvVar(envPath, "STRIPE_PRICE_ID", price.id);

const account = await stripe.accounts.retrieve();
console.log("\nStripe OK (test mode)");
console.log("Account:", account.id);
console.log("STRIPE_PRICE_ID записан в .env.local:", price.id);
console.log(
  "\nWebhook: в Stripe Dashboard → Developers → Webhooks → Add endpoint",
);
console.log(
  "  URL: https://<ваш-домен>/api/stripe/webhook",
);
console.log(
  "  События: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted",
);
console.log(
  "\nЛокально без CLI: после оплаты подписка синхронизируется по session_id на главной.",
);
