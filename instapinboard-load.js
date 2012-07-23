// Fire up the jams
chrome.contextMenus.removeAll();
var ctxPinboard = chrome.contextMenus.create(
  {
    "title": "Post to Pinboard"
    , "onclick": postToPinboard
  }
);