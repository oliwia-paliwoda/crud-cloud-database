const express = require("express");
const client = require("./db");
const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/create-table", async (req, res) => {
    const { tableName } = req.body;

    try {
        await client.query(`CREATE TABLE ${tableName} (id SERIAL PRIMARY KEY);`);
        res.json({ message: `Tabela ${tableName} utworzona` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd SQL" });
    }
});


app.listen(PORT, () => console.log(`Server działa na http://localhost:${PORT}`));
