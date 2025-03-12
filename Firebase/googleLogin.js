const { getAuth, GoogleAuthProvider, sendPasswordResetEmail, updateCurrentUser, browserSessionPersistence, setPersistence, signInWithPopup, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, onAuthStateChanged, signInWithEmailAndPassword, signOut } = require('firebase/auth')

const db = require('./models')

const provider = new GoogleAuthProvider();

const auth = getAuth();

module.exports = {
    googleLogin: async (req, res) => {
        let userdata = JSON.parse(req.body.user)
        if (req.session.uid) {
            return
        }
        if (userdata.uid) {
            let accessToken = userdata.stsTokenManager.accessToken
            await require('../functions').verifyAuthToken(accessToken).then(async (result) => {
                if (result) {
                    req.session.uid = result
                    req.session.accesstoken = accessToken
                    await createDb(userdata)
                }
                return
            })
        }
    },
    // singInEmail: async (req, res) => {
    //     setPersistence(auth, browserSessionPersistence).then(() => {
    //         signInWithEmailAndPassword(auth, req.body.email, req.body.senha).then(async (userCredential) => {
    //             const user = userCredential.user;

    //             if (user) {
    //                 let accessToken = user.stsTokenManager.accessToken
    //                 await require('../functions').verifyAuthToken(accessToken).then((result) => {
    //                     if (result) {
    //                         req.session.uid = result
    //                         req.session.accesstoken = accessToken
    //                         return res.redirect('/home')
    //                     }
    //                 })
    //             }
    //         }).catch((error) => {
    //             const errorCode = error.code;
    //             const errorMessage = error.message;
    //             console.log(error);
    //             if (errorCode == 'auth/wrong-password') {
    //                 return res.redirect('/login?pass=invalid')
    //             }

    //         })
    //     })

    // },
    // singUpEmail: async (req, res) => {
    //     setPersistence(auth, browserSessionPersistence).then(() => {
    //         createUserWithEmailAndPassword(auth, req.body.email, req.body.senha).then(async (userCredential) => {
    //             const user = userCredential.user;
    //             if (user) {
    //                 user.displayName = req.body.username
    //                 let accessToken = user.stsTokenManager.accessToken
    //                 await require('../functions').verifyAuthToken(accessToken).then(async (result) => {
    //                     if (result) {
    //                         req.session.uid = result
    //                         req.session.accesstoken = accessToken
    //                         await createDb(user)
    //                         return res.redirect('/home')
    //                     }
    //                 })
    //             }
    //         })
    //     })
    // },
 
}
