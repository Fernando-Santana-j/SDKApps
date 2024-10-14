let chatIsOpen = false
let countMensages = 0
let app = null
let db = null
let ticketProt = null
let guildId = '1210907838558240829' //"1246186853241978911"


document.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.closest('#create-ticket-button')) {
        let ticketOptions = {
            idioma: 'pt',
            motivo: '',
            type: 1
        }

        if (document.getElementById('ticket-motivo-input').value.length > 0) {
            const opcoes = document.getElementById('ticket-motivo-input-list').querySelectorAll('option');
            opcoes.forEach(option => {
                if (option.value === document.getElementById('ticket-motivo-input').value) {
                    ticketOptions.motivo = option.getAttribute('data-code');
                }
            });
        } else {
            errorNotify('Por favor, selecione um motivo válido da lista.');
            return
        }

        try {
            let session = await fetch('/ticket/create', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    guildId: guildId,
                    userID: userID,
                    ticketOptions: ticketOptions
                }),
            }).then(response => { return response.json() })
            if (session.success == true) {
                successNotify(session.data)
                document.getElementById("chat-mensages-content-mens").style.display = 'flex'
                document.getElementById("create-ticket-content").style.display = 'none'
            } else {
                errorNotify(session.data)
            }
        } catch (error) {
            errorNotify('Erro ao tentar criar o ticket!');
        }
    }
})

async function createTicketUI() {
    document.getElementById("chat-mensages-content-mens").style.display = 'none'
    document.getElementById("create-ticket-content").style.display = 'flex'
    document.getElementById('ticket-motivo-input').addEventListener('blur', function () {
        const inputValue = this.value.toLowerCase();
        const datalistOptions = Array.from(document.getElementById('ticket-motivo-input-list').getElementsByTagName('option'));
        const validOptions = datalistOptions.map(option => option.value.toLowerCase());

        if (!validOptions.includes(inputValue)) {
            errorNotify('Por favor, selecione um motivo válido da lista.');
            this.value = '';
        }
    });
}


init()
async function init() {
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
            let docChange = await doc.docChanges()
            for (let index = 0; index < docChange.length; index++) {
                const change = docChange[index];
                let data = change.doc.data()
                if (change.type === "removed" && change.doc.id && change.doc.id.includes(userID)) {
                    var parentElement = document.getElementById("chat-mensages-content-mens");
                    while (parentElement.firstChild) {
                        parentElement.removeChild(parentElement.firstChild);
                    }
                    createTicketUI()
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
                            chatIcon.setAttribute('data-mensages', countMensages)
                        }
                    }
                    document.getElementById('chat-mensages-content-mens').innerHTML += ` 
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
                    let conte = document.getElementById('chat-mensages-content-mens')
                    conte.scrollTop = conte.scrollHeight;

                }
                if (change.type == "added") {
                    const date = new Date(Number(data.created));
                    let dateForm = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                    if (change.doc.id && change.doc.id.includes(userID)) {
                        ticketProt = change.doc.id

                        data.mensages.forEach((element, index) => {
                            countMensages++
                            if (chatIsOpen == false) {
                                if (countMensages > 0) {
                                    let chatIcon = document.getElementById('chat-icon-containner')
                                    chatIcon.classList.add('newMensage')
                                    chatIcon.setAttribute('data-mensages', countMensages)
                                }
                            }
                            document.getElementById('chat-mensages-content-mens').innerHTML += ` 
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
                        let conte = document.getElementById('chat-mensages-content-mens')
                        conte.scrollTop = conte.scrollHeight;
                    }
                }

            }
            if (!ticketProt) {
                createTicketUI()
            }
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
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            guildId: ticket.serverID,
            channelId: ticket.channel,
            userID: userID,
            content: content,
            protocolo: ticketProt,
            admin: false,
            trad: false
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)

    } else {
        errorNotify(session.data)
    }
}

document.getElementById('chat-input-send').addEventListener('click', () => {
    sendMensage()
})

document.addEventListener('keypress', (event) => {
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
        let conte = document.getElementById('chat-mensages-content-mens')
        conte.scrollTop = conte.scrollHeight;
        document.getElementById('chat-icon-containner').classList.remove('newMensage')
    } else {
        chatIsOpen = false
        chatContainner.style.display = "none"
    }
})