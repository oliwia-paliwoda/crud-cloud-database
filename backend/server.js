const express = require("express");
const cors = require("cors");
const client = require("./db");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post("/create-table", async (req, res) => {
    const { tableName, columns } = req.body;

    if (!tableName || !tableName.trim()) {
        return res.status(400).json({ error: "Table name is required" });
    }

    try {
        let columnDefinitions = "id SERIAL PRIMARY KEY";

        if (Array.isArray(columns) && columns.length > 0) {
            const colDefs = columns.map(col => {
                const colName = col.name.trim();
                const colType = col.type.trim();
                return `${colName} ${colType}`;
            });

            columnDefinitions += ", " + colDefs.join(", ");
        }

        const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");

        const query = `CREATE TABLE ${safeTableName} (${columnDefinitions});`;

        await client.query(query);
        res.json({ message: `Tabela ${safeTableName} utworzona` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd SQL" });
    }
});

app.get("/tables", async (req, res) => {
    try {
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        const tables = result.rows.map(row => row.table_name);
        res.json({ tables });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd pobierania tabel" });
    }
});




app.listen(PORT, () => console.log(`Server działa na http://localhost:${PORT}`));
