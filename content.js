console.log('content script loaded!');

const main = () => {
    console.log('dom ready! main start!');
    document.getElementById('sdetails').focus(); 
}

const waitDomLoad = setInterval(() => {
    if(document.getElementById('sname') !== undefined) {
        clearInterval(waitDomLoad);
        main()
    } 
},1000)



chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
      if (request.greeting == "hello"){
          console.log(request.srBody);
          const {user_nm, dept_nm, sr_body} = request.srBody;

          document.getElementById('sname').innerText = user_nm;
          document.getElementById('reqpersonid').innerText = user_nm;
          document.getElementById('sdeptname').value = dept_nm;
          document.getElementById('sdeptname').focus();
          document.getElementById('sdeptname').blur();
          document.getElementById('sreqkind_label').innerHTML = '2.현업요청 대리등록';
          document.getElementById('sreqkind_label').focus();
          document.getElementById('sreqkind_label').blur();

          document.getElementById('sdetails').value = sr_body;
          document.getElementById('sdetails').focus();  
          document.getElementById('sdetails').blur();  
    
          sendResponse({farewell: "goodbye"});
      }
      

});

