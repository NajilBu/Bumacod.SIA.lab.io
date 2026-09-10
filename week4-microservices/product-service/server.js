const express = require("express");

const app = express();

app.use(express.json());

const products = [
    {
        id: 1,
        name: "Laptop",
        price: 45000
    },
    {
        id: 2,
        name: "Keyboard",
        price: 1500
    },
    {
        id: 3,
        name: "Mouse",
        price: 800
    }
];

app.get("/", (req, res) => {
    res.json({
        service: "Product Service",
        status: "Running"
    });
});

app.get("/products", (req, res) => {
    res.json(products);
});

app.get("/products/:id", (req, res) => {

    const productId = parseInt(req.params.id);

    const product = products.find(
        item => item.id === productId
    );

    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    res.json(product);
});

app.listen(3002, () => {
    console.log("Product Service running on port 3002");
});
