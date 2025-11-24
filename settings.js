// settings.js
const { getAllUserEnv } = require('./settingsdb');

let envsettings = {};

async function initEnvsettings(userId) {
  envsettings = await getAllUserEnv(userId);
  console.log("⚙️ Settings loaded for user:", userId);
}

function getSetting(key) {
  return envsettings[key] || null;
}

function updateSetting(key, value) {
  envsettings[key] = value;
}

function getFullSettings() {
  return envsettings; 
}

module.exports = {
  initEnvsettings,
  getSetting,
  updateSetting,
  getFullSettings
};
