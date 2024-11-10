let gamePopup = null;

browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({ extensionEnabled: false });
});

browser.browserAction.onClicked.addListener(() => {
  if (gamePopup) {
    browser.windows.remove(gamePopup.id);
    gamePopup = null;
  } else {
    browser.windows.create({
      url: 'game.html',
      type: 'popup',
      width: 420,
      height: 700 // Increased height to accommodate buttons
    }).then((windowInfo) => {
      gamePopup = windowInfo;
    });
  }
});

browser.windows.onRemoved.addListener((windowId) => {
  if (gamePopup && gamePopup.id === windowId) {
    gamePopup = null;
  }
});
