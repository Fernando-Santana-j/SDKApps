let serverID = location.pathname.replace('/server/permissions/', "")


let rolesCol = document.querySelectorAll('.roles-col span')
async function convertHexColor(color) {
    color = parseInt(color)
    if (color == 0) {
        return '#828e94'
    }
    return `#${await color.toString(16)}`
}
rolesCol.forEach(async elemento => {
    const cor = elemento.getAttribute('data-color');
    let convertColor = await convertHexColor(cor)
    console.log(convertColor);
    elemento.style.color = convertColor;
});

document.getElementById('roles-row').addEventListener('click',async function (event) {
    if (event.target.classList.contains('text-role-col')) {
        document.querySelectorAll('.text-role-col').forEach(text=>{
            text.style.textDecoration = 'none'
        })
        
        let element = event.target
        element.style.textDecoration = 'underline'
        let id = element.getAttribute('data-roleID')
        let permRow = document.getElementById('permissions-row')
        permRow.setAttribute('data-rolesIdEdit', id)
        let permsActual = await fetch('/perms/get', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serverID: serverID,
                roleID:id
            }),
        }).then((response)=>{return response.json()})
        if (!permsActual.data) {
            return
        }
        
        permRow.innerHTML = `
            <div id="permission-col">
                <div class="perm-content" id="perm-commands-content">
                    <div class="perm-left-content">
                        <div class="title-col">Permitir usar comandos</div>
                        <div class="desc-col">Caso esteja ativo, quem estiver com cargo poderá usar os comandos do bot.</div>
                    </div>
                    <div class="perm-button-content">
                        <div id="perm-commands-checkbox-content">
            
                            <label id="perm-commands-label" class="switch">
                                <input id="perm-commands-checkbox" ${permsActual.data.commands == true ? 'checked' : ''} type="checkbox">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="linha"></div>
                <div class="perm-content" id="perm-commandsAllChannel-content">
                    <div class="perm-left-content">
                        <div class="title-col">Permitir usar comandos em qualquer canal</div>
                        <div class="desc-col">Caso esteja ativo, quem estiver com cargo poderá usar os comandos do bot em qualquer canal.</div>
                    </div>
                    <div class="perm-button-content">
                        <div id="perm-commandsAllChannel-checkbox-content">
                    
                            <label id="perm-commandsAllChannel-label" class="switch">
                                <input id="perm-commandsAllChannel-checkbox" ${permsActual.data.commandsAllChannel == true ? 'checked' : ''} type="checkbox">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="linha"></div>
                <div class="perm-content" id="perm-botEdit-content">
                    <div class="perm-left-content">
                        <div class="title-col">Permitir configurar o bot</div>
                        <div class="desc-col">Caso esteja ativo, quem estiver com cargo poderá acessar esse site e configurar o bot..</div>
                    </div>
                    <div class="perm-button-content">
                        <div id="perm-botEdit-checkbox-content">
                        
                            <label id="perm-botEdit-label" class="switch">
                                <input id="perm-botEdit-checkbox" ${permsActual.data.botEdit == true ? 'checked' : ''} type="checkbox">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="linha"></div>
                <div class="perm-content" id="perm-paymentEdit-content">
                    <div class="perm-left-content">
                        <div class="title-col">Permitir configurar meios de pagamento</div>
                        <div class="desc-col">Caso esteja ativo, quem estiver com cargo poderá acessar esse site e configurar os metodos de pagamento.</div>
                    </div>
                    <div class="perm-button-content">
                        <div id="perm-paymentEdit-checkbox-content">
                        
                            <label id="perm-paymentEdit-label" class="switch">
                                <input id="perm-paymentEdit-checkbox" ${permsActual.data.paymentEdit == true ? 'checked' : ''} type="checkbox">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        
        `
        document.getElementById('perm-commands-checkbox').addEventListener('click', () => {
            sendModifyPerm('perm-commands-checkbox')
        })
        document.getElementById('perm-commandsAllChannel-checkbox').addEventListener('click', () => {
            sendModifyPerm('perm-commandsAllChannel-checkbox')
        })
        document.getElementById('perm-paymentEdit-checkbox').addEventListener('click', () => {
            sendModifyPerm('perm-paymentEdit-checkbox')
        })
        document.getElementById('perm-botEdit-checkbox').addEventListener('click', () => {
            sendModifyPerm('perm-botEdit-checkbox')
        })
        successNotify('Cargo trocado!')
    }
});

function sendModifyPerm(item) {
    let itemDOM = document.getElementById(item)
    let itemName = item.replace('perm-', "").replace('-checkbox', "")
    let role = document.getElementById('permissions-row').getAttribute('data-rolesIdEdit')
    if (itemDOM && itemName &&  role) {
        fetch('/perms/changeOne', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serverID: serverID,
                item: itemName,
                value: itemDOM.checked,
                roleID:role
            }),
        })
        successNotify('Permissões alteradas!')
    }
}

