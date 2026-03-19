import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import https from "https";

const SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY || "aa9223b7519f4a9ca93b874014d5e768";
const BASE_URL = process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

const agent = new https.Agent({ keepAlive: true });

async function createUser() {
  const userId = uuidv4();

  try {
    await axios.post(`${BASE_URL}/v1_0/apiuser`, {
      providerCallbackHost: "https://example.com"
    }, {
      httpsAgent: agent,
      headers: {
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        "Content-Type": "application/json",
        "X-Reference-Id": userId
      },
      timeout: 60000
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ User created with ID:", userId);
    }
    return userId;
  } catch (err) {
    console.error("❌ Error creating MoMo user:", err.message);
    throw err;
  }
}

async function createApiKey(userId) {
  try {
    const res = await axios.post(`${BASE_URL}/v1_0/apiuser/${userId}/apikey`, null, {
      headers: {
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY
      }
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ API Key:", res.data.apiKey);
    }
    return res.data.apiKey;
  } catch (err) {
    console.error("❌ Error creating API key:", err.message);
    throw err;
  }
}

// Only run setup if called directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const userId = await createUser();
      const apiKey = await createApiKey(userId);

      console.log("Save these in your .env:");
      console.log("MOMO_API_USER =", userId);
      console.log("MOMO_API_KEY =", apiKey);
    } catch (err) {
      console.error("Setup failed:", err);
    }
  })();
}

export { createUser, createApiKey };