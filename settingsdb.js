const axios = require('axios');

// Firebase Database URL from your firebaseConfig
const BASE_URL = 'https://chamamdnew-default-rtdb.firebaseio.com';

// Update/Create single key for a user
async function updateUserEnv(key, value, userId) {
  if (!userId) throw new Error("User ID missing");

  const res = await axios.put(`${BASE_URL}/${userId}/${key}.json`, JSON.stringify(value));
  return res.data;
}

// Get single key value for a user
async function getUserEnv(key, userId) {
  if (!userId) throw new Error("User ID missing");

  const res = await axios.get(`${BASE_URL}/${userId}/${key}.json`);
  return res.data;
}

// Get all keys/values for a user
async function getAllUserEnv(userId) {
  if (!userId) throw new Error("User ID missing");

  const res = await axios.get(`${BASE_URL}/${userId}.json`);
  return res.data || {};
}

// Initialize default values if missing
async function initUserEnvIfMissing(userId) {
  if (!userId) {
    console.error("❌ User ID is missing");
    return;
  }

  const defaults = {
    AUTO_REACT: "off",
    PRESENCE_TYPE: "on",
    PRESENCE_FAKE: "both",
    ANTI_CALL: "on",
    ANTI_DELETE: "on",
    CREATE_NB: userId
  };

  for (const key in defaults) {
    const current = await getUserEnv(key, userId);
    if (current === null || current === undefined) {
      await updateUserEnv(key, defaults[key], userId);
      console.log(`✅ Initialized [${userId}] ${key} = ${defaults[key]}`);
    }
  }
}

// Get total active bots count
async function getActiveBotCount() {
  try {
    // Assuming user IDs are stored at the root
    const res = await axios.get(`${BASE_URL}.json`);
    if (res.data) {
      return Object.keys(res.data).length;
    }
    return 0;
  } catch (error) {
    console.error("❌ Error fetching active bot count:", error.message);
    return 0;
  }
}

module.exports = {
  updateUserEnv,
  getUserEnv,
  getAllUserEnv,
  initUserEnvIfMissing,
  getActiveBotCount
};
