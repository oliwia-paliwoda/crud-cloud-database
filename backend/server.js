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
        res.json({ message: `Table ${safeTableName} has been created` });

    } catch (err) {
        console.error(err);

        if (err.code === '42P07') {
            return res.status(400).json({ error: `Table ${tableName} already exists` });
        }

        res.status(500).json({ error: "SQL error" });
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
        res.status(500).json({ error: "Table fetch error" });
    }
});

app.delete("/table/:name", async (req, res) => {
    const tableName = req.params.name;

    if (!tableName || !tableName.trim()) {
        return res.status(400).json({ error: "Table name is required" });
    }

    try {
        const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
        await client.query(`DROP TABLE IF EXISTS ${safeTableName};`);
        res.json({ message: `Table ${safeTableName} has been deleted` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "SQL error" });
    }
});

app.get("/get-table", async (req, res) => {
    const { name } = req.query;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Table name is required" });
    }

    try {
        const safeTableName = name.replace(/[^a-zA-Z0-9_]/g, "");

        const colsQuery = `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position;
        `;
        const colsResult = await client.query(colsQuery, [safeTableName]);
        const columns = colsResult.rows.map(r => ({
            name: r.column_name,
            type: r.data_type
        }));

        const rowsQuery = `SELECT * FROM ${safeTableName};`;
        const rowsResult = await client.query(rowsQuery);

        res.json({
            table: safeTableName,
            columns,
            rows: rowsResult.rows
        });

    } catch (err) {
        console.error(err);

        if (err.code === "42P01") {
            return res.status(400).json({ error: `Table ${name} does not exist` });
        }

        res.status(500).json({ error: "SQL error" });
    }
});


app.post("/add-record", async (req, res) => {
    const { tableName, record } = req.body;

    if (!tableName || !record) {
        return res.status(400).json({ error: "tableName and record are required" });
    }

    try {
        const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");

        const colsQuery = `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
        `;
        const colsResult = await client.query(colsQuery, [safeTable]);
        const columns = {};
        colsResult.rows.forEach(c => {
            columns[c.column_name] = c.data_type;
        });

        // Walidacja typów
        for (const [key, value] of Object.entries(record)) {
            if (value === null || value === "null") continue;

            const type = columns[key];
            if (!type) continue;

            if (type.includes("int")) {
                if (isNaN(value)) {
                    return res.status(400).json({ error: `Column '${key}' expects an integer.` });
                }
            } else if (type.includes("character") || type.includes("text")) {
            } else if (type === "boolean") {
                if (value !== true && value !== false && value !== "true" && value !== "false") {
                    return res.status(400).json({ error: `Column '${key}' expects a boolean.` });
                }
            } else if (type === "date") {
                if (isNaN(Date.parse(value))) {
                    return res.status(400).json({ error: `Column '${key}' expects a valid date.` });
                }
            }
        }

        const payload = { ...record };
        if (!payload.id) delete payload.id;

        const keys = Object.keys(payload);
        const values = Object.values(payload);

        let query;
        if (keys.length > 0) {
            const cols = keys.join(", ");
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
            query = `INSERT INTO ${safeTable} (${cols}) VALUES (${placeholders}) RETURNING *;`;
        } else {
            query = `INSERT INTO ${safeTable} DEFAULT VALUES RETURNING *;`;
        }

        const result = await client.query(query, values);

        res.json({
            message: "Record added",
            inserted: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        if (err.code === "42P01") {
            return res.status(400).json({ error: `Table '${tableName}' does not exist.` });
        }

        if (err.code === "23505") {
            return res.status(400).json({ error: "Duplicate ID. This ID already exists." });
        }

        res.status(500).json({ error: "SQL error", details: err.message });
    }
});


app.delete("/delete-record", async (req, res) => {
    const { tableName, id } = req.body;

    if (!tableName || !id) {
        return res.status(400).json({ error: "tableName and id are required" });
    }

    try {
        const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");
        const query = `DELETE FROM ${safeTable} WHERE id = $1 RETURNING *;`;
        const result = await client.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        res.json({
            message: "Record deleted",
            deleted: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "SQL error", details: err.message });
    }
});

app.post("/add-column", async (req, res) => {
    const { tableName, newColumn } = req.body;
    const { name, type, default: defaultValue } = newColumn || {};

    if (!tableName || !name || !type) {
        return res.status(400).json({ error: "tableName, name and type are required" });
    }

    const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const safeColumn = name.replace(/[^a-zA-Z0-9_]/g, "");

    let sqlDefault = "";
    let value = defaultValue;

    if (value === "" || (typeof value === "string" && value.toLowerCase() === "null")) {
        value = null;
    }

    if (value !== null && value !== undefined) {
        try {
            switch (type.toUpperCase()) {
                case "INT":
                    if (isNaN(value)) throw new Error("Default must be a number");
                    sqlDefault = `DEFAULT ${value}`;
                    break;
                case "BOOLEAN":
                    if (!["true", "false"].includes(value.toLowerCase())) {
                        throw new Error("Default must be true or false");
                    }
                    sqlDefault = `DEFAULT ${value.toLowerCase()}`;
                    break;
                case "DATE":
                    if (isNaN(Date.parse(value))) throw new Error("Default must be a valid date");
                    sqlDefault = `DEFAULT '${value}'`;
                    break;
                case "VARCHAR(100)":
                case "VARCHAR":
                    sqlDefault = `DEFAULT '${value}'`;
                    break;
                default:
                    throw new Error("Unknown type");
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    try {
        const query = `ALTER TABLE ${safeTable} ADD COLUMN ${safeColumn} ${type} ${sqlDefault};`;
        await client.query(query);

        res.json({ message: `Column '${name}' added to table '${tableName}'.` });
    } catch (err) {
        console.error(err);

        if (err.code === "42701") {
            return res.status(400).json({ error: `Column '${name}' already exists.` });
        }
        if (err.code === "42P01") {
            return res.status(400).json({ error: `Table '${tableName}' does not exist.` });
        }

        res.status(500).json({ error: "SQL error", details: err.message });
    }
});








app.listen(PORT, () => console.log(`Server działa na http://localhost:${PORT}`));
