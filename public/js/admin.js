let ticketIndex = {
    index: 0,
    id: ''
}
let app = null
let db = null


init()
async function init(params) {
    let session = await fetch('/firebase/configs', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: '',
    }).then(response => { return response.json() })
    if (session.success == true) {
        const appFirebase = await firebase.initializeApp({
            credential: session.data,
            projectId: session.projectId
        });
        const dbFirebase = await firebase.firestore();
        app = await appFirebase
        db = await dbFirebase
        await dbFirebase.collection("tickets").onSnapshot({ includeMetadataChanges: true }, async (doc) => {
            doc.docChanges().forEach((change, index) => {
                let data = change.doc.data()
                if (change.type === "removed" && data.serverID == '1246186853241978911') {
                    let row = document.querySelector(`#ticket-open-row`)
                    let element = document.querySelector(`#ticket-open-row .ticket-open-col[data-protocolo='${change.doc.id}']`)
                    if (element.getAttribute('data-index') == ticketIndex.index) {
                        document.getElementById('ticket-mensage-content').innerHTML = ''
                    }
                    row.removeChild(element)
                    
                }
                if (change.type == 'modified' && change.doc.id && change.doc.id == ticketIndex.id && data.serverID == '1246186853241978911') {
                    let newMensage = data.mensages[(parseInt(data.mensages.length) - 1)]
                    const date = new Date(Number(newMensage.timestamp));
                    let dateForm = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} - ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                    document.getElementById('ticket-mensage-content').innerHTML += ` 
                        <div class="mensage-ticket-containner ${newMensage.userID == user ? "myMensage" : ""}">
                            <div class="mensage-ticket">
                                <div class="mensage-ticket-image">
                                    <img src="${newMensage.userPic}">
                                </div>
                                <div class="mensage-ticket-content">
                                    <div class="mensage-ticket-content-top">
                                        <span class="mensage-ticket-name">${newMensage.author}</span> • <span class="mensage-ticket-date">${dateForm}</span>
                                    </div>
                                    <p class="mensage-ticket-text">${newMensage.content}</p>
                                </div>
                            </div>
                        </div>
                    `
                    let conte = document.getElementById('ticket-mensages-containner')
                    conte.scrollTop = conte.scrollHeight;

                }
                if (change.type == "added" && data.serverID == '1246186853241978911') {
                    const date = new Date(Number(data.created));
                    let dateForm = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                    document.getElementById('ticket-open-row').innerHTML += `
                        <div class="ticket-open-col" data-index="${index}" data-protocolo="${data.protocolo}" title="Ticket de ${data.userName}">
                            <div class="ticket-open-col-image">
                                <img src="${data.userPic}">
                            </div>
                            <div class="ticket-open-col-texts">
                                <p class="ticket-open-col-name">Ticket de ${data.userName}</p>
                                <p class="ticket-open-col-date">${dateForm}</p>
                            </div>
                        </div>
                    `
                }
            })
        });

    }

}


async function selectTicket(protocolo, index) {
    ticketIndex.id = protocolo
    ticketIndex.index = index
    let ticket = await db.collection("tickets").doc(protocolo).get()
    ticket = await ticket.data()
    document.getElementById('ticket-mensage-content').innerHTML = ''
    ticket.mensages.forEach((element, index) => {
        const date = new Date(Number(element.timestamp));
        let dateForm = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} - ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        document.getElementById('ticket-mensage-content').innerHTML += ` 
            <div class="mensage-ticket-containner ${element.userID == user ? "myMensage" : ""}">
                <div class="mensage-ticket">
                    <div class="mensage-ticket-image">
                        <img src="${element.userPic}">
                    </div>
                    <div class="mensage-ticket-content">
                        <div class="mensage-ticket-content-top">
                            <span class="mensage-ticket-name">${element.author}</span> • <span class="mensage-ticket-date">${dateForm}</span>
                        </div>
                        <p class="mensage-ticket-text">${element.content}</p>
                    </div>
                </div>
            </div>
        `
        let conte = document.getElementById('ticket-mensages-containner')
        conte.scrollTop = conte.scrollHeight;
    })

}

document.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.closest('.ticket-open-col')) {
        let closest = target.closest('.ticket-open-col')
        selectTicket(closest.getAttribute('data-protocolo'), closest.getAttribute('data-index'))
    }
})


async function sendMensage() {
    
    let ticket = await db.collection("tickets").doc(ticketIndex.id).get()
    ticket = await ticket.data()
    let content = document.getElementById('input-mensage').value
    document.getElementById('input-mensage').value = ''
    let session = await fetch('/send/discordMensage', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
            
        },
        body: JSON.stringify({
            guildId: ticket.serverID,
            channelId: ticket.channel,
            userID:user,
            content: content,
            protocolo:ticketIndex.id,
            admin:true,
            trad:true
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
        
    }else{
        errorNotify(session.data)
    }
}

document.getElementById('send-mensage-ticket').addEventListener('click',()=>{
    sendMensage()
})

document.addEventListener('keypress',(event)=>{
    if (event.key === "Enter" && document.activeElement == document.getElementById('input-mensage')) {
        sendMensage()
    }
})