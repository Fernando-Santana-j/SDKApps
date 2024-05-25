var user = null
initLogin()
async function initLogin() {
    let userID = window.prompt('Digite o codigo do usuario: ')
    let pass = window.prompt('Digite a senha: ')
    
    if (userID == null || !userID || !pass || pass == null) {
        location.href = '/'
    } else {
        let session = await fetch('/verify/adm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: userID,
                pass: pass
            }),
        })
        session = await session.json()
        if (session.success == true) {
            user = session.data
            var novoScript = document.createElement('script');
            novoScript.src = `${location.origin}/public/js/admin.js`;
            novoScript.type = 'module'
            document.body.appendChild(novoScript);
        } else {
            location.href = '/'
        }
    }
}