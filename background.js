const enabledChanged = (changes) =>
  !changes.settings.oldValue ||
  changes.settings.newValue.enabled !== changes.settings.oldValue.enabled;

const harvestTokenSet = (changes) =>
  changes.settings.newValue.harvest_token.length > 0 &&
  (!changes.settings.oldValue ||
    changes.settings.oldValue.harvest_token.length === 0);

const harvestAccountIdSet = (changes) =>
  changes.settings.newValue.harvest_account_id.length > 0 &&
  (!changes.settings.oldValue ||
    changes.settings.oldValue?.harvest_account_id.length === 0);

const harvestCredentialsSet = (changes) =>
  harvestTokenSet(changes) && harvestAccountIdSet(changes);

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local") {
      if (enabledChanged(changes)) {
        updateIcon();
      } else if (harvestCredentialsSet(changes)) {
        enableExtension();
      }
    }
  });

  initSettings();
  chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  updateIcon();
});

chrome.action.onClicked.addListener(async function (tab) {
  try {
    await isHarvestSet();
    toggleExtension();
  } catch (err) {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  }
});

const defaultSettings = {
  enabled: false,
  harvest_account_id: "",
  harvest_token: "",
};

function initSettings() {
  chrome.storage.local.get("settings", (data) => {
    const settings = {
      ...defaultSettings,
      ...data?.settings,
    };
    chrome.storage.local.set({ settings });
  });
}

function isHarvestSet() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("settings", (data) => {
      if (
        !("settings" in data) ||
        !("harvest_token" in data.settings) ||
        !("harvest_account_id" in data.settings) ||
        data.settings.harvest_token.length === 0 ||
        data.settings.harvest_account_id.length === 0
      ) {
        reject("Harvest keys missing. Set it on extension options.");
      }
      resolve(data.settings);
    });
  });
}

function enableExtension() {
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings;
    settings.enabled = true;
    chrome.storage.local.set({ settings });
  });
}

function toggleExtension() {
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings;
    settings.enabled = !settings.enabled;
    chrome.storage.local.set({ settings });
  });
}

function updateIcon() {
  chrome.storage.local.get("settings", (data) => {
    setIcon(data.settings.enabled);
  });
}

function setIcon(enabled) {
  const icon = enabled ? "images/icon48.png" : "images/icon48_disabled.png";
  chrome.action.setIcon(
    {
      path: icon,
    }
  );
}
