const express = require('express');
const router = express.Router();
const db = require('../../Firebase/models')
const functions = require('../../functions');
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'))
    },
    filename: function (req, file, cb) {
        const codigo = require('crypto').randomBytes(32).toString('hex');
        const originalName = file.originalname;
        const date = Date.now()
        let extension = originalName.substr(originalName.lastIndexOf('.'));
        
        if (!extension || !extension.includes('.')) {
            extension = file.mimetype.replace('image/', '.');
        }
        const fileName = date + '-' + codigo + extension;
        
        cb(null, `${fileName}`)
    }
});

const upload = multer({ storage });













router.post('/product/create',upload.fields([{ name: 'productLogo', maxCount: 1 }, { name: 'productBackGround', maxCount: 1 }]), functions.authPostState, async (req, res) => {
    try {
        let {storeID ,name, description, price, type, featured, stockObject} = req.body;
        
        if (!storeID) {
            return res.status(200).json({ success: false, data: "Não foi possivel identificar a loja" })
        }
        
        let store = await db.findOne({colecao: 'stores', doc: storeID})

        if (!store) {
            return res.status(200).json({ success: false, data: "Loja não encontrada" })
        }

        price = parseInt(price);
        stockObject = JSON.parse(stockObject);

        if (!name || name.trim().length < 5) {
            return res.status(200).json({ success: false, data: "O nome do produto é obrigatório" })
        }
        if (!description || description.trim().length < 10) {
            return res.status(200).json({ success: false, data: "A descrição do produto é obrigatória" })
        }
        if (!price || price <= 0) {
            return res.status(200).json({ success: false, data: "O preço do produto é obrigatório" })
        }
        if (!type) {
            return res.status(200).json({ success: false, data: "O tipo do produto é obrigatório" })
        }
        if (!stockObject || stockObject.length <= 0) {
            return res.status(200).json({ success: false, data: "O estoque do produto é obrigatório" })
        }
        if (req.files.productLogo) {
            functions.comprimAndRecort(req.files.productLogo[0].path, path.join(__dirname,`../../uploads/stores/products/logos/${req.files.productLogo[0].filename}`))
        }
        if (req.files.productBackGround) {
            functions.comprimAndRecort(req.files.productBackGround[0].path, path.join(__dirname,`../../uploads/stores/products/backgrounds/${req.files.productBackGround[0].filename}`))
        }

        let newProduct = {
            id: `prod-${storeID}-${Date.now()}`,
            name: name,
            description: description,
            price: price,
            type: type,
            featured: featured,
            stock: stockObject,
            logo: req.files.productLogo ? `/uploads/stores/products/logos/${req.files.productLogo[0].filename}` : null,
            background: req.files.productBackGround ? `/uploads/stores/products/backgrounds/${req.files.productBackGround[0].filename}` : null,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            
        }

        let storeProducts = store.products;

        storeProducts.push(newProduct);

        await db.update("stores",storeID,{products: storeProducts})

        res.status(200).json({ success: true, data: "Produto criado com sucesso" });
    } catch (error) {
        console.log('RouteCreateProductERROR',error); 
        if (!res.headersSent) {
            res.status(200).json({ success: false, data:"Erro ao criar produto, Verifique os dados e tente novamente" })
        }
    }
})



router.post('/product/edit',upload.fields([{ name: 'productLogo', maxCount: 1 }, { name: 'productBackGround', maxCount: 1 }]), functions.authPostState, async (req, res) => {
    try {
        let {storeID ,name, description, price, type, featured, stockObject, productID} = req.body;
        
        if (!storeID) {
            return res.status(200).json({ success: false, data: "Não foi possivel identificar a loja" })
        }
        
        let store = await db.findOne({colecao: 'stores', doc: storeID})

        if (!store) {
            return res.status(200).json({ success: false, data: "Loja não encontrada" })
        }

        price = parseInt(price);
        stockObject = JSON.parse(stockObject);

        if (!name || name.trim().length < 5) {
            return res.status(200).json({ success: false, data: "O nome do produto é obrigatório" })
        }
        if (!description || description.trim().length < 10) {
            return res.status(200).json({ success: false, data: "A descrição do produto é obrigatória" })
        }
        if (!price || price <= 0) {
            return res.status(200).json({ success: false, data: "O preço do produto é obrigatório" })
        }
        if (!type) {
            return res.status(200).json({ success: false, data: "O tipo do produto é obrigatório" })
        }
        if (!stockObject || stockObject.length <= 0) {
            return res.status(200).json({ success: false, data: "O estoque do produto é obrigatório" })
        }
        if (req.files.productLogo) {
            functions.comprimAndRecort(req.files.productLogo[0].path, path.join(__dirname,`../../uploads/stores/products/logos/${req.files.productLogo[0].filename}`))
        }
        if (req.files.productBackGround) {
            functions.comprimAndRecort(req.files.productBackGround[0].path, path.join(__dirname,`../../uploads/stores/products/backgrounds/${req.files.productBackGround[0].filename}`))
        }    
        
        let productIndex = store.products.findIndex(product => product.id == productID);

        if (productIndex == -1) {
            return res.status(200).json({ success: false, data: "Produto não encontrado" })
        }

        let product = store.products[productIndex];

        product.name = name;
        product.description = description;
        product.price = price;
        product.type = type;
        product.featured = featured;
        product.stock = stockObject;
        product.logo = req.files.productLogo ? `/uploads/stores/products/logos/${req.files.productLogo[0].filename}` : product.logo;
        product.background = req.files.productBackGround ? `/uploads/stores/products/backgrounds/${req.files.productBackGround[0].filename}` : product.background;
        product.updatedAt = Date.now();

        store.products[productIndex] = product;

        await db.update("stores",storeID,{products: store.products})

        res.status(200).json({ success: true, data: "Produto editado com sucesso" });


    } catch (error) {
        console.log('RouteEditProductERROR',error); 
        if (!res.headersSent) {
            res.status(200).json({ success: false, data:"Erro ao editar produto, Verifique os dados e tente novamente" })
        }
    }
})


router.post('/product/delete', functions.authPostState, async (req, res) => {
    try {
        let {storeID, productID} = req.body;
        
        if (!storeID) {
            return res.status(200).json({ success: false, data: "Não foi possivel identificar a loja" })
        }

        let store = await db.findOne({colecao: 'stores', doc: storeID})
        
        if (!store) {
            return res.status(200).json({ success: false, data: "Loja não encontrada" })
        }

        let productIndex = store.products.findIndex(product => product.id == productID);
        
        if (productIndex == -1) {
            return res.status(200).json({ success: false, data: "Produto não encontrado" })
        }

        store.products.splice(productIndex, 1);

        await db.update("stores",storeID,{products: store.products})

        res.status(200).json({ success: true, data: "Produto deletado com sucesso" });
    } catch (error) {
        console.log('RouteDeleteProductERROR',error); 
        if (!res.headersSent) {
            res.status(200).json({ success: false, data:"Erro ao deletar produto, Verifique os dados e tente novamente" })
        }
    }
})

router.post('/product/get', functions.authPostState, async (req, res) => {
    try {
        let {storeID, productID} = req.body;

        if (!storeID) {
            return res.status(200).json({ success: false, data: "Não foi possivel identificar a loja" })
        }
        
        if (!productID) {
            return res.status(200).json({ success: false, data: "Não foi possivel identificar o produto" })
        }

        let store = await db.findOne({colecao: 'stores', doc: storeID})

        if (!store) {
            return res.status(200).json({ success: false, data: "Loja não encontrada" })
        }

        let product = store.products.find(product => product.id == productID)

        if (!product) {
            return res.status(200).json({ success: false, data: "Produto não encontrado" })
        }

        res.status(200).json({ success: true, data: product })
        
        
    } catch (error) {
        console.log('RouteGetProductERROR',error); 
        if (!res.headersSent) {
            res.status(200).json({ success: false, data:"Erro ao buscar produto, Verifique os dados e tente novamente" })
        }
    }
})


router.post('/product/get-all', functions.authPostState, async (req, res) => {
    try {
        let {storeID} = req.body;
        if (!storeID) {
            return res.status(200).json({ success: false, data: "Não foi possivel identificar a loja" })
        }

        let store = await db.findOne({colecao: 'stores', doc: storeID})
        
        
        if (!store) {
            return res.status(200).json({ success: false, data: "Loja não encontrada" })
        }

        res.status(200).json({ success: true, data: store.products })
        
    } catch (error) {
        console.log('RouteGetAllProductsERROR',error); 
    }
})  





module.exports = router;
