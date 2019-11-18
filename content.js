// content script cannot access original web page's variables and functions
// so, i cannot use element.setValue() which provided by websqaure
// refer to https://stackoverflow.com/questions/12395722/can-the-window-object-be-modified-from-a-chrome-extension,
// try injecting script into web page

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
    // when background js send fillForm message
    const args = JSON.stringify(request.srBody);
    // to set websquare's component data, use id.setValue() ( learn by youtube)
    // but, content script cannot access original web page's variables and functions
    // so, cannot use element.setValue() which provided by websqaure
    // refer to stackoverflow,  injecting script into web page and pass arguments is only solution
    embed(runEmbedded, args);
    sendResponse({farewell:'goodbye'})
    // add button to tell sr-server case accepted
    try {
        document.getElementById('applySR').remove();
    } catch (err) {
        console.error('previous button not exists!');
    }
    const btn = document.createElement('button');
    btn.setAttribute('id', 'applySR');
    btn.innerHTML="접수[연동]";
    document.getElementById('formbutton').appendChild(btn); 
    const originalApplyBtn = document.getElementById('btnreceipt');
    btn.addEventListener('click', async (e) => {
        // send to sr-server case was applied
        try {
            console.log('update sr')
            const {case_id, user_id, user_nm, dept_nm, sr_body} = request.srBody;
            const baseUrl = await getBaseURL();
            const SR_GETBODY_URL = `${baseUrl}/sr/body/${case_id}`;
            const fetchOptions = {
                method : 'PUT',
                body : JSON.stringify({
                    user_id, 
                    user_nm,
                    dept_nm,
                    sr_body,
                    siis_saved_flag : 'Y'
                }),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            }
            const rawResponse = await fetch(SR_GETBODY_URL, fetchOptions);
            const response = await rawResponse.json();
            if(response.success) {
                console.log(`change siis_saved_flag to Y success! ${case_id}`);
                // original button event trigger
                originalApplyBtn.dispatchEvent(new Event('click'));
                return response.result;
            }            
            return [];
        } catch (err) {
            console.error(err);
            return [];
        }
    })
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





