var keyName = "instapinboard:Account",
	queueName = "instapinboard:QueuedItem";

function constructUrl (baseUrl, parameters, account) {
	var url = "https://" + account.UserName + ":" + account.Password + "@" + baseUrl;
	if (parameters) {
		var first = true;
		url += "?";
		for (var index in parameters) {
			if (!first)
				url += "&";
			url += index + "=" + encodeURIComponent(parameters[index]);
			first = false;
		}
	}
	return url;
}

function postToPinboard (info, tab) {
	var postInfo = { "url": tab.url, "description": tab.title };
		
	if (localStorage.getItem(keyName)) {
		post(postInfo, JSON.parse(localStorage.getItem(keyName)));
	}
	else {
		localStorage.setItem(queueName, JSON.stringify(postInfo));
		chrome.tabs.create({ "url": "settings.html" });
	}
}

function post(postInfo, account, callback) {
	var req =  new XMLHttpRequest();
	var url = constructUrl("api.pinboard.in/v1/posts/add", 
		{
			"url": postInfo.url
			, "description": postInfo.description
			, "tags": "instapinboard"
			, "toread": "yes"
		}, account);
	req.open("GET", url);
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			var rgxSuccess = /result\s+code=\"done\"/;
			if (req.responseText !== "" && !rgxSuccess.test(req.responseText)) {
				alert("Something went wrong! This is super helpful. Blame delicious' API. " + req.responseText);
			}
			else
				if (callback) {
					callback();
				}
		}
	};
	req.send();
}

function testAccount (postInfo, account, onSuccess) {
	var req =  new XMLHttpRequest();
	var url = constructUrl("api.pinboard.in/v1/posts/recent", 
		{
			"count": "1"
		}, account);
	req.open("GET", url);
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			toggleStatus();
			if (req.status == 200) {
				onSuccess();
			}
			else {
				alert("There was an issue loading your account. Make sure your account details are correct.");
			}
		}
	}
	req.send();
}

function setAcctDetails() {
	var uname = document.getElementById("uname"),
		passwd = document.getElementById("passwd");
	if (uname.value !== "" && passwd.value !== "") {
		toggleStatus();
		var account = { "UserName": uname.value, "Password": passwd.value };
		if (localStorage.getItem(queueName)) {
			var queueContent = localStorage.getItem(queueName);
			testAccount(queueContent, account, function() {
				localStorage.setItem(keyName, JSON.stringify(account));
				post(JSON.parse(queueContent), account, closeTab);
			});
		}
		else  {
			alert("Was not able to post URL after connecting account. Please try posting it again.");
			closeTab();
		}
	}
	else {
		alert("Please finish entering the correct values first.");
	}
}

function toggleStatus() {
	var statusBar = document.getElementById('status');
	if (statusBar.style.visibility === 'visible')
		statusBar.style.visibility = 'hidden';
	else
		statusBar.style.visibility = 'visible';
}

function closeTab() {
	chrome.tabs.getCurrent(function (tab) {
		if (tab) {
			chrome.tabs.remove(tab.id);
		}
	});
}