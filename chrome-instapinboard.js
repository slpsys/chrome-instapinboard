var keyName = "instapinboard:Account",
  queueName = "instapinboard:QueuedItem";

function constructTokenAuthString(account) {
  "use strict";
  // ?auth_token=user:NNNNNN
  return "&auth_token=" + account.Token;
}

function constructUrl(baseUrl, parameters, account) {
  "use strict";
  var url = "https://" + baseUrl,
    first = true,
    index;
  if (parameters) {
    url += "?";
    for (index in parameters) {
      if (parameters.hasOwnProperty(index)) {
        if (!first) {
          url += "&";
        }
        url += index + "=" + encodeURIComponent(parameters[index]);
        first = false;
      }
    }
  }
  return url + constructTokenAuthString(account);
}

function post(postInfo, account, callback) {
  "use strict";
  var req =  new XMLHttpRequest(),
    url = constructUrl("api.pinboard.in/v1/posts/add",
      {
        "url": postInfo.url
        , "description": postInfo.description
        , "tags": account.tags
        , "toread": account.toread
        , "shared": account.shared
      }, account);
  req.open("GET", url);
  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      var rgxSuccess = /result\s+code=\"done\"/;
      if (req.responseText !== "" && !rgxSuccess.test(req.responseText)) {
        alert("Something went wrong! This is super helpful. Blame delicious' API. " + req.responseText);
      } else if (callback) {
        callback();
      }
    }
  };
  req.send();
}

function postToPinboard(info, tab) {
  "use strict";
  var postInfo = { "url": tab.url, "description": tab.title };
  var acctDetails = JSON.parse(localStorage.getItem(keyName));

  if (acctDetails && acctDetails.Token) {
    post(postInfo, acctDetails);
  } else {
    localStorage.setItem(queueName, JSON.stringify(postInfo));
    chrome.tabs.create({ "url": "settings.html" });
  }
}

function toggleStatus() {
  "use strict";
  var statusBar = document.getElementById('status');
  if (statusBar.style.visibility === 'visible') {
    statusBar.style.visibility = 'hidden';
  } else {
    statusBar.style.visibility = 'visible';
  }
}

function testAccount(postInfo, account, onSuccess) {
  "use strict";
  var req =  new XMLHttpRequest(),
    url = constructUrl("api.pinboard.in/v1/posts/recent", { "count": "1" }, account);
  req.open("GET", url);
  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      toggleStatus();
      if (req.status === 200) {
        onSuccess();
      } else {
        alert("There was an issue loading your account. Make sure your account details are correct.");
      }
    }
  };
  req.send();
}

function cleanTags(tagstring) {
  "use strict";
  // only letting through a handful of non-word chars. whatever.
  return tagstring ? tagstring.replace(/[^\w\-_\+\s]/, "") : "";
}

function closeTab() {
  "use strict";
  chrome.tabs.getCurrent(function (tab) {
    if (tab) {
      chrome.tabs.remove(tab.id);
    }
  });
}

function setAcctDetails() {
  "use strict";
  var token = document.getElementById("token")
    , tags = document.getElementById("tags")
    , postPrivate = document.getElementById("private")
    , toRead = document.getElementById("toread")
    , account, queueContent;
  if (token.value !== "") {
    toggleStatus();
    account = {
      "Token": token.value
      , "shared": postPrivate.checked ? "no" : "yes"
      , "toread": toRead.checked ? "yes" : "no"
      , "tags": cleanTags(tags.value)
    };
    if (localStorage.getItem(queueName)) {
      queueContent = localStorage.getItem(queueName);
      testAccount(queueContent, account, function () {
        localStorage.setItem(keyName, JSON.stringify(account));
        post(JSON.parse(queueContent), account, closeTab);
      });
    } else {
      alert("Was not able to post URL after connecting account. Please try posting it again.");
      closeTab();
    }
  } else {
    alert("Please finish entering the correct values first.");
  }
}

document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    var submit = document.getElementById("settingsSubmit");
    if (submit && !submit.onclick) {
      submit.onclick = function () { setAcctDetails(); return false; };
    }
  }
}
