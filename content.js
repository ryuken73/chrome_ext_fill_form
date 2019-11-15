// content script cannot access original web page's variables and functions
// so, i cannot use element.setValue() which provided by websqaure
// refer to https://stackoverflow.com/questions/12395722/can-the-window-object-be-modified-from-a-chrome-extension,
// try injecting script into web page

const runEmbedded = (args) => {
    // by injecting script, i can access original web page's variable's and functions
    // sname, sdeptname and sdetails are websqaure's component.
    sname.setValue(args.user_nm);
    sdeptname.setValue(args.dept_nm);
    sdetails.setValue(args.sr_body);
    tel.setValue(args.handphone_nbr);
    sreqkind.setSelectedIndex(1);
}
const embed = (fn, args) => {
    const script = document.createElement("script");
    script.text = `(${fn.toString()})(${args});`;
    document.documentElement.appendChild(script);
}

const handleFillForm = (request, sender, sendResponse) => {
    const args = JSON.stringify(request.srBody);
    // to set websquare's component data, use id.setValue() ( learn by youtube)
    // but, content script cannot access original web page's variables and functions
    // so, cannot use element.setValue() which provided by websqaure
    // refer to stackoverflow,  injecting script into web page and pass arguments is only solution
    embed(runEmbedded, args);
    sendResponse({farewell:'goodbye'})
}

const handlers = {
    'fillForm' : handleFillForm,
}

const main = () => {
    console.log('dom ready! main start!');

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            const handler = handlers[request.type];
            handler(request, sender, sendResponse);
        }
    )
}

const waitDomLoad = setInterval(() => {
    if(document.getElementById('sname') !== undefined) {
        clearInterval(waitDomLoad);
        main()
    } 
},1000)





