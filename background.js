const URL_PATTERN = 'https://wise.sbs.co.kr/wise/websquare/websquare.html?w2xPath=/gwlib/apps/support/csrdb/square/reqsupport_edit.xml*';
const SBSSR_BASE_URL = 'http://10.10.1.14:3002/infra/sbssr/api';
const PARENT_CONTEXT_ID = 'srListParent';

const getSRBody = async (sr_id) => {
    const SR_GETBODY_URL = `${SBSSR_BASE_URL}/sr/body/${sr_id}`;
    const rawResponse = await fetch(SR_GETBODY_URL);
    const response = await rawResponse.json();
    if(response.success) return response.result;
    return [];
}

const getTodaySRList = async () => {
    const now = new Date();
    const todayString = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    const SR_GETLIST_URL = `${SBSSR_BASE_URL}/sr/list?fromDate=${todayString}`;
    const rawResponse = await fetch(SR_GETLIST_URL);
    const response = await rawResponse.json();
    if(response.success) return response.result;
    return [];
}

const onClickHandlerContext  = async (info, tab) => {
    if(info.parentMenuItemId === PARENT_CONTEXT_ID){
        const sr_id = info.menuItemId.split(':')[0];
        console.log(sr_id);
        const srBody = await getSRBody(sr_id);
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
