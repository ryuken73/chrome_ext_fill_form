const srInput = document.getElementById('srInput');
const reqBTN = document.getElementById('reqBTN');
const applyBTN = document.getElementById('applyBTN');
document.getElementById('reqBTN').addEventListener('click', async (e) => {
    //const srNumber = document.getElementById('srInput').value;
    const srNumber = srInput.value;
    const srGetUrl = `http://10.10.1.14:3002/infra/sbssr/api/sr/body/${srNumber}`;
    try {
        const rawResponse = await fetch(srGetUrl);
        const response = await rawResponse.json();
        console.log(response)
        if(response.success){
            console.log('request success!');
            document.getElementById('result').value = JSON.stringify(response.result);
        } else {
            document.getElementById('result').value = `sr get error : ${response.msg}`;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('result').value = `sr get failed : ${err}`;
    }
})


document.getElementById('applyBTN').addEventListener('click', () => {
    try {
        const srBody = JSON.parse(document.getElementById('result').value);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello", srBody}, function(response) {
              console.log(response.farewell);
            });
        });
    } catch {
        alert('not valid json type. try "send" again!')
    }
})