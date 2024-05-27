let chatIsOpen = false
let countMensages = 0
let app = null
let db = null
let ticketProt = null


init()
async function init(params) {
    let session = await fetch('/firebase/configs', {
        method: 'POST',
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
                if (change.type === "removed" && change.doc.id && change.doc.id.includes(userID)) {
                    var parentElement = document.getElementById("chat-containner");
                    while (parentElement.firstChild) {
                        parentElement.removeChild(parentElement.firstChild);
                    }
                }
                if (change.type == 'modified' && change.doc.id && change.doc.id.includes(userID)) {
                    let newMensage = data.mensages[(parseInt(data.mensages.length) - 1)]
                    const date = new Date(Number(newMensage.timestamp));
                    let dateForm = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} - ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                    countMensages++
                    if (chatIsOpen == false) {
                        if (countMensages > 0) {
                            let chatIcon = document.getElementById('chat-icon-containner')
                            chatIcon.classList.add('newMensage')
                            chatIcon.setAttribute('data-mensages',countMensages)
                        }
                    }
                    document.getElementById('chat-mensages-content').innerHTML += ` 
                        <div class="mensage-ticket-containner ${newMensage.userID == userID ? "myMensage" : ""}">
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
                    let conte = document.getElementById('chat-mensages-content')
                    conte.scrollTop = conte.scrollHeight;

                }
                if (change.type == "added") {
                    const date = new Date(Number(data.created));
                    let dateForm = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                    if (change.doc.id && change.doc.id.includes(userID)) {
                        ticketProt = change.doc.id

                        data.mensages.forEach((element,index)=>{
                            countMensages++
                            if (chatIsOpen == false) {
                                if (countMensages > 0) {
                                    let chatIcon = document.getElementById('chat-icon-containner')
                                    chatIcon.classList.add('newMensage')
                                    chatIcon.setAttribute('data-mensages',countMensages)
                                }
                            }
                            document.getElementById('chat-mensages-content').innerHTML += ` 
                                <div class="mensage-ticket-containner ${element.userID == userID ? "myMensage" : ""}">
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
                        })
                        let conte = document.getElementById('chat-mensages-content')
                        conte.scrollTop = conte.scrollHeight;
                    }
                }
            })
        });

    }

}

async function sendMensage() {
    let content = document.getElementById('chat-input-mensage').value

    if (content.trim().length <= 0) {
        errorNotify('Digite algo antes...')
        return 
    }

    if (!ticketProt) {
        errorNotify('Você não tem nenhum ticket aberto!')
        return 
    }

    let ticket = await db.collection("tickets").doc(ticketProt).get()
    ticket = await ticket.data()
    if (!ticket) {
        errorNotify('Erro ao obter o ticket!')
        return 
    }
    
    document.getElementById('chat-input-mensage').value = ''
    let session = await fetch('/send/discordMensage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            guildId: ticket.serverID,
            channelId: ticket.channel,
            userID:userID,
            content: content,
            protocolo:ticketProt,
            admin:false,
            trad:false
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
        
    }else{
        errorNotify(session.data)
    }
}

document.getElementById('chat-input-send').addEventListener('click',()=>{
    sendMensage()
})

document.addEventListener('keypress',(event)=>{
    if (event.key === "Enter" && document.activeElement == document.getElementById('chat-input-mensage')) {
        sendMensage()
    }
})

document.getElementById('chat-top-close').addEventListener('click', () => {
    document.getElementById('chat-containner').style.display = 'none'
})

document.getElementById('chat-icon-containner').addEventListener('click', () => {
    let chatContainner = document.getElementById('chat-containner')
    if (chatContainner.style.display == "none") {
        chatContainner.style.display = "flex"
        chatIsOpen = true
        countMensages = 0
        let conte = document.getElementById('chat-mensages-content')
        conte.scrollTop = conte.scrollHeight;
        document.getElementById('chat-icon-containner').classList.remove('newMensage')
    } else {
        chatIsOpen = false
        chatContainner.style.display = "none"
    }
})