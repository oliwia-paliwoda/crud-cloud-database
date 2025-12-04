const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

let users = [
    { id: 1, name: "Jan" },
    { id: 2, name: "Anna" }
];

app.get("/users", (req, res) => {
    res.json(users);
});

app.get("/users/:id", (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ message: "Nie znaleziono użytkownika" });
    res.json(user);
});

app.post("/users", (req, res) => {
    const newUser = {
        id: Date.now(),
        name: req.body.name
    };
    users.push(newUser);
    res.status(201).json(newUser);
});

app.put("/users/:id", (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ message: "Nie znaleziono użytkownika" });

    user.name = req.body.name;
    res.json(user);
});

app.delete("/users/:id", (req, res) => {
    users = users.filter(u => u.id != req.params.id);
    res.json({ message: "Użytkownik usunięty" });
});

app.listen(PORT, () => console.log(`Server działa na http://localhost:${PORT}`));
