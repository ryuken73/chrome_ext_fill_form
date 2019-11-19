const convertBlobToBase64 = blob => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
});

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

const getImageList = async imageList => {
    try {
        console.table(imageList);
        const baseUrl = await getBaseURL();
        const getImgPromises = imageList.map( async (image) => {
            const {file_id} = image;
            const SR_GETIMG_URL = `${baseUrl}/sr/attach/${file_id}`;
            const rawResponse = await fetch(SR_GETIMG_URL);
            const response = await rawResponse.blob();
            return response;
        })
        const imageBlobs = await Promise.all(getImgPromises);
        return imageBlobs;

    } catch (err) {
        console.error(err);
        return [];
    }
}

const runEmbedded = (args) => {
    // by injecting script, i can access original web page's variable's and functions
    // sname, sdeptname and sdetails are websqaure's component.

    const padZero = (num) => {
        if(num < 10){
            return '0'+num;
        }
        return num.toString();
    }
    
    const getDayShort = (dateTime) => {
        if(dateTime){
            const date = (dateTime instanceof Date) ? dateTime : new Date(parseInt(dateTime));
            const year = date.getFullYear();
            const month = padZero(date.getMonth() + 1);
            const day = padZero(date.getDate());
            const hour = padZero(date.getHours());
            const minute = padZero(date.getMinutes());
            const second = padZero(date.getSeconds());
            
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }
        return null;
    }

    try {
        const {user_nm, dept_nm, sr_body, handphone_nbr, replies} = args
        sname.setValue(user_nm);
        sdeptname.setValue(dept_nm);
        sdetails.setValue(sr_body);
        tel.setValue(handphone_nbr);
        sreqkind.setSelectedIndex(1);
        console.log(args);
        let replyString = ''
        for (const reply of replies) {
            const {save_dd, body} = reply;
            replyString += `${getDayShort(save_dd)} :
${body} \n`;
        }
        console.log(replyString);
        srdetails.setValue(replyString);
    } catch (err) {
        console.error(err);
    }

}
const embed = (fn, args) => {
    const script = document.createElement("script");
    script.text = `(${fn.toString()})(${args});`;
    document.documentElement.appendChild(script);
}

const handleFillForm = async (request, sender, sendResponse) => {
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
    // add image to dext5 body
    const {imageList} = request.srBody;
    const imageBlobs = await getImageList(imageList);
    /// find dex5 body element in iframe
    const outerFrame = document.getElementById('WEC');
    const innerFrame = outerFrame.contentWindow.document.getElementById('dext_frame_WEC');    
    const dextFrame = innerFrame.contentWindow.document.getElementById('dext5_design_WEC');
    const innerDoc = dextFrame.contentDocument || iframe.contentWindow.document;
    const dext5Body = innerDoc.getElementById('dext_body');
    /// append image (as base64)
    imageBlobs.map(async blob => {
        const imgTag = innerDoc.createElement('image');
        const base64Img = await convertBlobToBase64(blob);
        dext5Body.append(imgTag);
        imgTag.setAttribute('src', base64Img);
    })

    // add srApply link
    const srApplyLink = document.createElement('a');
    srApplyLink.setAttribute('href', '#');
    srApplyLink.innerHTML="SR연동접수";
    document.getElementById('group98').appendChild(srApplyLink); 
    //
    const originalApplyBtn = document.getElementById('btnreceipt');

    // srApplyLink's click handler
    srApplyLink.addEventListener('click', async (e) => {
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
                chrome.runtime.sendMessage({type: "refreshMenu"}, function(response) {
                    console.log(response.message);
                });
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





