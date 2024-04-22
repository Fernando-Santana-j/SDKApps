
const db = require('./db.js')
const { Readable } = require('stream');

module.exports = {
    findAll: async (props) => {
        let firebaseData = db.collection(props.colecao)

        return new Promise((resolve, reject) => {
            const outputStream = new Readable({ objectMode: true });
            outputStream._read = () => { };

            firebaseData.get().then((snapshot) => {
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    outputStream.push(data);
                });

                outputStream.push(null); // Indica o fim da stream
                resolve(outputStream.toArray());
            }).catch((error) => {
                console.error('Erro ao buscar dados do Firestore:', error);
                reject(error);
            });

            outputStream.on('error', (err) => {
                console.error(err);
                reject(err);
            });
        });
    },

    findOne: async (props) => {
        let firebaseData = db.collection(props.colecao)
        if (props.hasOwnProperty('doc')) {
            firebaseData = firebaseData.doc(props.doc)
        }
        if (props.hasOwnProperty('where')) {
            firebaseData = firebaseData.where(props.where[0],props.where[1],props.where[2])
        }
        return await firebaseData.get().then(async (res) => {
            let data 
            if (props.hasOwnProperty('where')) {
                data = res.docs[0].data()
            }else{
                data = res.data()
            }
            data.error = false
            return data
        }).catch((error) => {
            return {error:true,err:error}
            console.error('Erro ao buscar dados do Firestore:', error);
        });

    },
    update: async (colecao, doc, data) => {
        let firebaseData = db.collection(colecao).doc(doc)
        await firebaseData.update(data);
        return
    },
    delete: async (colecao, doc,) => {
        let firebaseData = db.collection(colecao).doc(doc)
        await firebaseData.delete();
        return
    },
    create: async (colecao, doc, data) => {
        let firebaseData = db.collection(colecao).doc(doc)
        await firebaseData.set(data);
        return
    }
}