const urlInput = document.getElementById('sbssrUrl');
const submitBtn = document.getElementById('submit');

const restore_options = () => {
    const savedKey = 'sbssrUrl';
    chrome.storage.local.get(savedKey, (result) => {
        urlInput.value = result ? result[savedKey] : 'http://10.10.1.14:3002/infra/sbssr/api';
    })
}

submitBtn.addEventListener('click', (e) => {
    const url = urlInput.value;
    alert(url);
    chrome.storage.local.set({sbssrUrl:url}, () => console.log(`set local storage : ${url}`));
})

document.addEventListener('DOMContentLoaded', restore_options);