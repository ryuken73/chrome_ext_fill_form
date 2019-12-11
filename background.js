const URL_PATTERN = 'https://wise.sbs.co.kr/wise/websquare/websquare.html?w2xPath=/gwlib/apps/support/csrdb/square/reqsupport_edit.xml*';
const PARENT_CONTEXT_ID = 'srListParent';

const getBaseURL = () => {
    return new Promise((resolve,reject) => {
        const savedKey = 'sbssrUrl';
        try {
            chrome.storage.local.get(savedKey, (result) => {
                resolve(result[savedKey])
            })
        } catch (error) {
            console.error(error);
            reject(error)
        }
    })
}

const getSRBody = async (sr_id) => {
    try {
        const baseUrl = await getBaseURL();
        const SR_GETBODY_URL = `${baseUrl}/sr/body/${sr_id}`;
        const rawResponse = await fetch(SR_GETBODY_URL);
        const response = await rawResponse.json();
        if(response.success) return response.result;
        return [];
    } catch (err) {
        return [];
    }
}

const getSRReply = async (sr_id) => {
    try {
        const baseUrl = await getBaseURL();
        const SR_GETREPLY_URL = `${baseUrl}/reply/list/${sr_id}`;
        const rawResponse = await fetch(SR_GETREPLY_URL);
        const response = await rawResponse.json();
        if(response.success) return response.result;
        return [];
    } catch (err) {
        return [];
    }
}

const getTodaySRList = async () => {
    try {
        const now = new Date();
        const todayString = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
        const baseUrl = await getBaseURL();
        const SR_GETLIST_URL = `${baseUrl}/sr/list?fromDate=${todayString}&siisSaved=N`;
        const rawResponse = await fetch(SR_GETLIST_URL);
        const response = await rawResponse.json();
        if(response.success) return response.result;
        return [];
    } catch (err) {
        return [];
    }
}

const onClickHandlerContext  = async (info, tab) => {
    if(info.parentMenuItemId === PARENT_CONTEXT_ID){
        const sr_id = info.menuItemId.split(':')[0];
        console.log(sr_id);
        const srBody = await getSRBody(sr_id);
        const srReply = await getSRReply(sr_id);
        srBody.replies = srReply;
        console.log(srBody);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: "fillForm", srBody}, function(response) {
              console.log(response.farewell);
            });
        });
    }
}

const refreshContextMenu = () => {
    chrome.contextMenus.removeAll(async () => {
        chrome.contextMenus.create({
            "id" : PARENT_CONTEXT_ID,
            "contexts" : ["all"],
            "title" : "import from sbssr",
            "documentUrlPatterns" : [URL_PATTERN]
        });
        try {
            const srList = await getTodaySRList();
            srList.length === 0 && chrome.contextMenus.create({title : '없음'});
            srList.map((sr,index) => {
                console.log(sr);
                const {case_id, user_nm, dept_nm, sr_body} = sr;
                const sr_body_short = sr_body.slice(0,10);
                chrome.contextMenus.create({
                    "id" : `${case_id}: ${user_nm}`,
                    "parentId" : PARENT_CONTEXT_ID,
                    "title" : `${case_id}:${dept_nm}-${user_nm}:${sr_body_short}`,
                    "documentUrlPatterns" : [URL_PATTERN]
                })
            })
        } catch (err) {
            console.error(err);
        }
    })
}

chrome.contextMenus.onClicked.addListener(onClickHandlerContext);

console.log('background outer start!');

// when browser connects wise.sbs.co.kr, popup.html activate
chrome.runtime.onInstalled.addListener(function() {
    // show popup.html 
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {hostEquals: 'wise.sbs.co.kr'},
        })
        ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

// when any tab connects target target, make context menus 
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
   if(changeInfo.status === 'complete' && tab.url){
       const targetUrl = URL_PATTERN.replace('*','');
       tab.url.startsWith(targetUrl) && refreshContextMenu();
   }
})

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.type == "refreshMenu"){
        console.log('receive refresh menu');
        refreshContextMenu();
        sendResponse({message: "refresh complete!"});
      }
});