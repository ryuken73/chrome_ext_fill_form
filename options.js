const urlInput = document.getElementById('sbssrUrl');
const submitBtn = document.getElementById('submit');
const clearBtn = document.getElementById('clear');
const defaultURL = 'http://10.10.1.14:3002/infra/sbssr/api';

const savedKey = 'sbssrUrl';
const restore_options = () => {
    chrome.storage.local.get(savedKey, (result) => {
        console.log(result);
        console.log(result[savedKey]);
        if(result[savedKey] == undefined){
            // set default value
            console.log('result empty!');
            chrome.storage.local.set({sbssrUrl:defaultURL}, () => {
                console.log(`set default value : ${url}`);
                urlInput.value = defaultURL;
            });
            return;
        }
        console.log('result not empty!')
        urlInput.value = result[savedKey];
    })
}

submitBtn.addEventListener('click', (e) => {
    const url = urlInput.value;
    alert(`saved! ${url}`);
    chrome.storage.local.set({sbssrUrl:url}, () => console.log(`set local storage : ${url}`));
})

clearBtn.addEventListener('click', (e) => {
    alert(`clear value!`);
    try {
        chrome.storage.local.remove(savedKey, (result) => {
            console.log('delete callback!')
            console.log(result);
        })
    } catch (err) {
        console.error(err)
    }
})

document.addEventListener('DOMContentLoaded', restore_options);