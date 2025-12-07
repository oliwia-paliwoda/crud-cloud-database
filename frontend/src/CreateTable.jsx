import "./CreateTable.scss"
import React, {useState, useEffect} from "react";

function CreateTable( {onCancel} ){

    const [tableName, setTableName] = useState("");
    const [columns, setColumns] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    const columnTypes = ["VARCHAR(100)", "INT", "BOOLEAN", "DATE"];

    const addColumn = () => {
        setColumns([...columns, { name: "", type: columnTypes[0], default: "" }]);
    };


    const updateColumn = (index, field, value) => {
        const newColumns = [...columns];
        newColumns[index][field] = value;
        setColumns(newColumns);
    };

    const handleReset = () => {
        setErrorMessage("");
        setColumns([]);
        setTableName("");
    };

    const handleCancel = () => {
        handleReset();
        onCancel();
    };

    const handleSubmit = async () => {
        if (!tableName.trim()) {
            setErrorMessage("Table name is required.");
            return;
        }

        for (let col of columns) {
            if (!col.name.trim()) {
                setErrorMessage("All columns must have a name.");
                return;
            }
        }

        const tableObject = { tableName, columns };
        console.error(tableObject);

        try {
            const res = await fetch("http://localhost:5000/create-table", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tableObject)
            });

            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data.error || "Unknown server error");
                return;
            }

            setErrorMessage(data.message + ". Please return to the main screen.");
            setTableName("");
            setColumns([]);

        } catch (err) {
            console.error("Fetch error:", err);
        }
    };




    return(
        <div className="create-window">
            <div className="top">
            <div className="name">
                Table name
                <input
                value={tableName}
                onChange={e => setTableName(e.target.value)}
                />
            </div>

            <div className="columns-button">
                <button onClick={addColumn}>Add column</button>
                <button onClick={handleReset}>Reset</button>
                </div>
            </div>

            <div className="columns">
                {columns.map((col, index) => (
                    <div key={index} className="column-row">
                        <input
                            placeholder="Column name"
                            value={col.name}
                            onChange={(e) => updateColumn(index, "name", e.target.value)}
                        />
                        <input
                            placeholder="DEFAULT"
                            value={col.default || ""}
                            onChange={(e) => updateColumn(index,"default", e.target.value)}
                        />
                        <select
                            value={col.type}
                            onChange={(e) => updateColumn(index, "type", e.target.value)}
                        >
                            {columnTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            <div>{errorMessage}</div>
            <button onClick={handleSubmit}>Submit</button>
            <button onClick={handleCancel}>Return</button>

        </div>
    )
}

export default CreateTable