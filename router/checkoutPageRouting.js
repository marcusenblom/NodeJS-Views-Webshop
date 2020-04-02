const express = require ('express');
const Product = require('../model/productModel');
const verifyToken = require('./verifyToken');
const stripe = require('stripe')('sk_test_wZ9dIlcniFvD1pMbpR7PswOw00cDgCIEjA');
const {
    User
} = require("../model/userModel");

const router = express.Router();

router.get("/checkout", verifyToken, async (req, res) => {

    const user = await User.findOne({
        _id: req.user.user._id
    }).populate("cart.productId");

    
    
    let totalPrice = 0;

    for (let i = 0; i < user.cart.length; i++) {
        totalPrice += user.cart[i].amount * user.cart[i].productId.price
        
    }
    user.totalCartPrice = totalPrice;
    await user.save()

    if(user.cart.length >= 1){
        return stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: user.cart.map((product)=>{
                return {
                    name: product.productId.title,
                    amount: product.productId.price*100,
                    quantity: product.amount, // Hämtar från usermodel > cart > amount
                    currency: "sek"
                }
            }),
            success_url: "http://localhost:4000/",
            cancel_url: "http://localhost:4000/checkout"
        }).then( (session) => {
            res.render("checkout", {user, sessionId:session.id})
        }); 
    } else {
        res.render("checkout", {user, sessionId: undefined})
    }
    
    
});

module.exports = router;