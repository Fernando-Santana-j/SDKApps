class NameChecker {
    constructor(inputId, APIData, onNameCheck, debounceTime = 500) {
        this.input = document.getElementById(inputId);
        this.APIData = APIData;
        this.debounceTime = debounceTime;
        this.timeout = null;
        this.onNameCheck = onNameCheck;
        
        this.init();
    }

    init() {
        if (this.input.value) {
            this.handleInput();
        }
        this.input.addEventListener('input', () => {
            this.handleInput();
        });
    }

    handleInput() {
        clearTimeout(this.timeout);
        
        const name = this.input.value.trim();
        
        if (name === '') {
            this.onNameCheck && this.onNameCheck(null);
            return;
        }

        this.timeout = setTimeout(() => {
            this.checkName(name);
        }, this.debounceTime);
    }

    async checkName(name) {
        try {
            const response = await this.mockApiCall(name);
            
            
            this.onNameCheck && this.onNameCheck({
                name,
                isAvailable: response.available,
            });
        } catch (error) {
            this.onNameCheck && this.onNameCheck({
                name,
                error: error.message,
            });
        }
    }

    mockApiCall(name) {
        return new Promise(async(resolve) => {
            let session = await fetch('/get/verifyItem',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    colecao: this.APIData.colecao, 
                    itemID: this.APIData.itemID, 
                    ItemValue: name
                })
            }).then(response => { return response.json() })
            if (session.success == true) {
                resolve({
                    available: !session.exist
                });
            }else{
                console.log(session);
                
            }
            
        });
    }
}