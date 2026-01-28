import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const SUBSCRIPTION_KEY = "aa9223b7519f4a9ca93b874014d5e768"; // no trailing >
const BASE_URL = "https://sandbox.momodeveloper.mtn.com";

import https from "https";

const agent = new https.Agent({ keepAlive: true });


async function createUser() {
  const userId = uuidv4(); // generate your own UUID

  await axios.post(`${BASE_URL}/v1_0/apiuser`, {
  providerCallbackHost: "https://example.com"
}, {
  httpsAgent: agent,
  headers: {
    "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
    "Content-Type": "application/json",
    "X-Reference-Id": userId
  },
  timeout: 60000 // increase timeout
});

  console.log("✅ User created with ID:", userId);
  return userId;
}

async function createApiKey(userId) {
  const res = await axios.post(`${BASE_URL}/v1_0/apiuser/${userId}/apikey`, null, {
    headers: {
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY
    }
  });

  console.log("✅ API Key:", res.data.apiKey);
  return res.data.apiKey;
}

(async () => {
  const userId = await createUser();
  const apiKey = await createApiKey(userId);

  console.log("Save these in your .env:");
  console.log("MOMO_API_USER =", userId);
  console.log("MOMO_API_KEY =", apiKey);
})();
