const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
const users = [
    {
        id: 1,
        name: "Juan Dela Cruz",
        favoriteProductId: 1
    },
    {
        id: 2,
        name: "Maria Santos",
        favoriteProductId: 2
    }
];
app.get("/", (req, res) => {
    res.json({
        service: "User Service",
        status: "Running"
    });
});
app.get("/users", (req, res) => {
    res.json(users);
});
app.listen(3001, () => {
    console.log("User Service running on port 3001");
});

app.get("/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = users.find((item) => item.id === userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    try {
        const productResponse = await axios.get(
            `http://product-service:3002/products/${user.favoriteProductId}`
        );

        res.json({
            user: user,
            favoriteProduct: productResponse.data
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to communicate with Product Service"
        });
    }
});