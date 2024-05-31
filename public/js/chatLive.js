let chatIsOpen = false
let countMensages = 0
let app = null
let db = null
let ticketProt = null


document.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.closest('#create-ticket-button')) {
        let ticketOptions = {
            idioma: 'pt',
            motivo: '',
            type: 1
        }

        if (document.getElementById('ticket-motivo-input').value.length > 0) {
            ticketOptions.motivo = document.getElementById('ticket-motivo-input').value
        } else {
            errorNotify('Por favor, selecione um motivo válido da lista.');
            return
        }

        try {
            let session = await fetch('/ticket/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    guildId: '1234582432196333729',
                    // guildId: '1210907838558240829',
                    userID: userID,
                    ticketOptions: ticketOptions
                }),
            }).then(response => { return response.json() })
            if (session.success == true) {
                successNotify(session.data)
                document.getElementById("chat-mensages-content").innerHTML = ''
            } else {
                errorNotify(session.data)
            }
        } catch (error) {
            errorNotify('Erro ao tentar criar o ticket!');
        }
    }
})

async function createTicketUI() {
    var chatContent = document.getElementById("chat-mensages-content");
    chatContent.innerHTML = `
        <div id="create-ticket-content">
            <div id="create-ticket-motivo">
                <label for="ticket-motivo-input" class="lable-padrao">Selecione com oque você precisa de ajuda!</label>
                <input required type="text" class="input-padrao" list="ticket-motivo-input-list" placeholder="Pesquise o motivo..." id="ticket-motivo-input">
                <datalist id="ticket-motivo-input-list">
                    <option data-code="bot" selected value="BOT">Problemas com o funcionamento do BOT SDK!</option>
                    <option data-code="plat" selected value="Plataforma">Problemas no funcionamento ou funcionalidades do site SDK!</option>
                    <option data-code="duv" selected value="Duvidas">Duvidas sobre a plataforma ou bot SDK!</option>
                    <option data-code="sup" selected value="Suporte">Suporte Geral para qualquer outro problema com a SDK!</option>
                </datalist>
            </div>
            <div id="create-ticket-idioma">
                <label for="ticket-idioma-input" class="lable-padrao">Selecione o seu idioma!</label>
                <input required type="text" style="opacity: 0.8;" value="Português" disabled class="input-padrao" list="ticket-idioma-input-list" placeholder="Pesquise o seu idioma..." id="ticket-idioma-input">
                <datalist id="ticket-idioma-input-list">
                    <option data-code="pt" selected value="Português"></option>
                </datalist>
            </div>
            <button id="create-ticket-button" class="button-padrao">🎫 Criar Ticket</button>
        </div>
    `
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
                    var parentElement = document.getElementById("chat-mensages-content");
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

                        data.mensages.forEach((element, index) => {
                            countMensages++
                            if (chatIsOpen == false) {
                                if (countMensages > 0) {
                                    let chatIcon = document.getElementById('chat-icon-containner')
                                    chatIcon.classList.add('newMensage')
                                    chatIcon.setAttribute('data-mensages', countMensages)
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

            }
            console.log(ticketProt);
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
        let conte = document.getElementById('chat-mensages-content')
        conte.scrollTop = conte.scrollHeight;
        document.getElementById('chat-icon-containner').classList.remove('newMensage')
    } else {
        chatIsOpen = false
        chatContainner.style.display = "none"
    }
})