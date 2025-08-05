javascript:(function(){
  function getVar(mod, key) {
    try { return require([mod])[key]; } catch(e) { return ""; }
  }
  let popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.top = '20px';
  popup.style.right = '20px';
  popup.style.zIndex = 99999;
  popup.style.background = '#fff';
  popup.style.border = '2px solid #4267B2';
  popup.style.padding = '20px';
  popup.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
  popup.style.fontFamily = 'Arial,sans-serif';
  popup.innerHTML = `
    <h3 style="margin-top:0;color:#4267B2;">FB Friend Request</h3>
    <textarea id="fb_uids" placeholder="Enter 5-50 User IDs, one per line" style="width:220px;height:90px;padding:4px;"></textarea>
    <br>
    <button id="fb_send" style="margin-top:8px;padding:4px 10px;">Send</button>
    <button id="fb_close" style="position:absolute;top:5px;right:5px;">✖</button>
    <div id="fb_status" style="margin-top:10px;font-size:13px;max-height:120px;overflow:auto;"></div>
  `;
  document.body.appendChild(popup);
  document.getElementById('fb_close').onclick = function(){
    popup.remove();
  };
  document.getElementById('fb_send').onclick = async function(){
    let raw = document.getElementById('fb_uids').value;
    let status = document.getElementById('fb_status');
    let uids = raw.split(/[\s,]+/).map(x=>x.trim()).filter(x=>x.length>0);
    if(uids.length < 1) {
      status.textContent = "Please enter at least 1 user ID.";
      status.style.color = "red";
      return;
    }
    if(uids.length > 50) {
      status.textContent = "Please enter no more than 50 user IDs.";
      status.style.color = "red";
      return;
    }
    status.innerHTML = "Sending requests...<br>";
    var spinr = getVar("SiteData", "__spin_r");
    var spinB = getVar("SiteData", "__spin_b");
    var spinT = getVar("SiteData", "__spin_t");
    var jazoest = getVar("SprinkleConfig", "jazoest");
    var fb_dtsg = getVar("DTSGInitialData", "token");
    var uid = getVar("CurrentUserInitialData", "ACCOUNT_ID");
    var lsd = getVar("LSD", "token");
    var hsi = getVar("SiteData", "hsi");
    for(let i=0;i<uids.length;i++) {
      let target_uid = uids[i];
      status.innerHTML += `Sending to <b>${target_uid}</b>... `;
      let data = new URLSearchParams();
      data.append('av', uid);
      data.append('__user', uid);
      data.append('__a', '1');
      data.append('__req', 'r');
      data.append('__hs', hsi);
      data.append('dpr', window.devicePixelRatio || 1);
      data.append('__ccg', 'EXCELLENT');
      data.append('__rev', spinr);
      data.append('fb_dtsg', fb_dtsg);
      data.append('jazoest', jazoest);
      if(lsd) data.append('lsd', lsd);
      data.append('fb_api_caller_class', 'RelayModern');
      data.append('fb_api_req_friendly_name', 'FriendingCometFriendRequestSendMutation');
      data.append('variables', JSON.stringify({
        input: {
          click_proof_validation_result: '{"validated":true}',
          friend_requestee_ids: [target_uid],
          friending_channel: "WELCOME_DASH",
          warn_ack_for_ids: [],
          actor_id: uid,
          client_mutation_id: "1"
        },
        scale: 1
      }));
      data.append('server_timestamps', 'true');
      data.append('doc_id', '23982103144788355');
      try {
        let res = await fetch('https://www.facebook.com/api/graphql/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*'
          },
          body: data.toString()
        });
        let text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch(e) {
          status.innerHTML += `<span style="color:red;">Not JSON: ${text.slice(0,100)}</span><br>`;
          continue;
        }
        if(json.data && json.data.friend_request_send && json.data.friend_request_send.friend_requestees && json.data.friend_request_send.friend_requestees[0].friendship_status === "OUTGOING_REQUEST") {
          status.innerHTML += `<span style="color:green;">Success</span><br>`;
        } else {
          status.innerHTML += `<span style="color:red;">Failed</span><br>`;
        }
      } catch(e) {
        status.innerHTML += `<span style="color:red;">Error</span><br>`;
      }
      await new Promise(r=>setTimeout(r,1500));
    }
    status.innerHTML += "<b>Done!</b>";
  };
})();
