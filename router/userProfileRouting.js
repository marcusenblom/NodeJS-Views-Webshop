const express = require('express');
const Product = require('../model/productModel');
const router = express();
const verifyToken = require('./verifyToken');
const stripe = require('stripe')('sk_test_wZ9dIlcniFvD1pMbpR7PswOw00cDgCIEjA');
const {
    User
} = require("../model/userModel");
router.get('/myaccount', verifyToken, async (req, res)=> {

    const user = await User.findOne({
        _id: req.user.user._id
    })

    res.send(`Hi ${user.firstName} ${user.surName}! This is your account `)
})

router.post("/cart/:id", verifyToken, async (req, res) => {

    const product = await Product.findOne({_id: req.params.id}).populate("user");
    const size = req.body.size

    const user = await User.findOne({
        _id: req.user.user._id
    }).populate("cart.productId");

    await user.addToCart(product, size);
    
    res.redirect(`/products/${req.params.id}`);

    // Lägg till så att man kan lägga till ett nytt objekt till cart om storleken inte stämmer

});

router.get("/reduceCart/:index", verifyToken, async (req, res) => {


    const index = req.params.index
    const user = await User.findOne({_id: req.user.user._id});
    await user.reduceCart(index);

    res.redirect('/checkout');

});

router.get("/increaseCart/:index", verifyToken, async (req, res) => {


    const index = req.params.index
    const user = await User.findOne({_id: req.user.user._id});
    await user.increaseCart(index);

    res.redirect('/checkout');

});


router.get("/deleteCart/:index", verifyToken, async (req, res) => {


    const index = req.params.index
    const user = await User.findOne({_id: req.user.user._id});
    await user.removeFromCart(index);

    res.redirect('/checkout');

});


router.get("/order", verifyToken, async (req, res) => {

    const user = await User.findOne({_id: req.user.user._id}).populate("cart.productId");
    

    return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: user.cart.map((product)=>{
            return {
                name: product.productId.title,
                amount: product.productId.price * 100,
                quantity: amount, // Hämtar från usermodel > cart > amount
                currency: "sek"
            }
        }),
        sucess_url: "http://localhost:4000/",
        cancel_url: "http://localhost:4000/products"
    }).then( (session) => {
        res.render("checkout", {user, sessionId: session.id})
    });

});




module.exports = router;