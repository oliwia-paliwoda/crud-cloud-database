import "./Table.scss";
import React, {useState, useEffect} from "react";
import TableElement from "./TableElement";


function Table({tableName, onReturn}){

    const [data, setData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [actionMessage, setActionMessage] = useState("Select a row to remove or edit it.");
    const [errorMessage, setErrorMessage] = useState("");
    const [newColumn, setNewColumn] = useState({ type: "VARCHAR(100)" });
    const columnTypes = ["VARCHAR(100)", "INT", "BOOLEAN", "DATE"];


    const updateColumn = (key, value) => {
        setNewColumn(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleRemoveColumn = async () => {
        if (!newColumn.name) {
            setErrorMessage("Please select a column to remove");
            return;
        }
        try {
            const res = await fetch("http://localhost:5000/remove-column", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tableName, columnName: newColumn.name })
            });
            const json = await res.json();
            if (res.ok) {
                setActionMessage(json.message || `Column ${newColumn.name} removed`);
                fetchTableData();
                actionCancel();
            } else {
                setErrorMessage(json.error || "Error removing column");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Error removing column");
        }
    };


    const addColumn = async () => {
        if (!newColumn.name || !newColumn.type) {
            setErrorMessage("Column name and type are required");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/add-column", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tableName, newColumn })
            });

            const json = await res.json();
            if (res.ok) {
                setActionMessage(json.message);
                fetchTableData();
                setNewColumn({type: "VARCHAR(100)"});
                setActionType(null);
                setErrorMessage("");
            }
            else {
                setErrorMessage(json.error);
            }

        } catch (err) {
            console.error(err);
            setActionMessage("Error adding column");
        }
    };

    const handleEditRecord = async () => {
        if (focusedIndex === null) return;

        if (Object.keys(newRecord).length === 0) {
            setActionMessage("No changes made");
            setActionType(null);
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/edit-record", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableName,
                    id: data[focusedIndex].id,
                    updatedFields: newRecord
                })
            });

            const json = await res.json();
            if (res.ok) {
                setActionMessage(json.message || "Record updated");
                fetchTableData();
                setNewRecord({});
                setActionType(null);
                setErrorMessage("");
            } else {
                setErrorMessage(json.error || "Error updating record");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Error updating record");
        }
    };




    const fetchTableData = async () => {
        try {
            const res = await fetch(`http://localhost:5000/get-table?name=${tableName}`);
            const json = await res.json();
            setHeaders(json.columns);
            setData(json.rows);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTableData();
    }, [tableName]);

    const deleteRow = async (id) => {
        const recordToDelete = data[id];
        if (!recordToDelete?.id) {
            console.error("No ID found for the selected record");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/delete-record", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableName,
                    id: recordToDelete.id
                })
            });

            const json = await res.json();
            setActionMessage(json.message);

            fetchTableData();
            actionCancel();

        } catch (err) {
            console.error(err);
        }
    }

    const [newRecord, setNewRecord] = useState({});

    const handleAddRecord = async () => {
        const recordToSend = { ...newRecord };

        console.log("Wysyłam rekord:", recordToSend);

        try {
            const res = await fetch("http://localhost:5000/add-record", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableName,
                    record: recordToSend
                })
            });

            const data = await res.json();
            if (res.ok) {
                setActionMessage(data.message || "Record added");
                fetchTableData();
                setNewRecord({});
                setActionType(null);
                setErrorMessage("");
            } else {
                setErrorMessage(data.error || "Error adding record");
            }

        } catch (err) {
            console.error(err);
        }
    };


    const [focusedIndex, setFocusedIndex] = useState(null);

    const [actionType, setActionType] = useState(null);
    const handleActionType=(action) => {
        setActionType(action);
        setErrorMessage("");
    };

    const actionCancel = () => {
        setActionType(null);
        setFocusedIndex(null);
        setActionMessage("Select a row to remove or edit it.");
        setNewColumn({});
        setNewRecord({});
        setErrorMessage("");
    }

    useEffect(() => {
        if(actionType === "add" || actionType === "add-column")
        {
            setFocusedIndex(null);
        }
    }, [actionType]);

    return(
        <div className="table-page">
            <div className="dashboard">
                <button className="return" onClick={onReturn}>Return</button>
                <div className="table-name">{tableName}</div>
                <div className="tools">
                    <button className="tool-button" onClick={() => handleActionType("add")}>Add row</button>
                    <button className="tool-button" onClick={() => handleActionType("add-column")}>Add column</button>
                    <button className="tool-button" onClick={() => handleActionType("remove-column")}>Remove column</button>
                    {(focusedIndex !== null) &&
                        <div style={{display: "flex", gap: "2vmin"}}>
                    <button className="tool-button-pick" onClick={() => handleActionType("remove")}>Remove record</button>
                    <button className="tool-button-pick" onClick={() => handleActionType("edit")}>Edit record</button>
                            </div>
                    }
                </div>
            </div>

        <div className="table-details">
            <table style={{ borderCollapse: "collapse", width: "90%" }}>
                <thead>
                <tr>
                    {headers.map((col) => (
                        <th
                            key={col.name}
                            style={{
                                border: "1px solid #333",
                                padding: "8px",
                                backgroundColor: "pink",
                                textTransform: "capitalize",
                            }}
                        >
                            {col.name} ({col.type})
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {data.map((row, rowIndex) => {
                    const isFocused = focusedIndex === rowIndex;
                    return (
                        <tr
                            key={rowIndex}
                            onClick={() => setFocusedIndex(rowIndex)}
                            style={{
                                backgroundColor: isFocused ? "deeppink" : "transparent",
                                cursor: "pointer",
                            }}
                        >
                            {headers.map((col) => (
                                <td
                                    key={col.name}
                                    style={{
                                        border: "1px solid #333",
                                        padding: "8px",
                                        textAlign: "center",
                                    }}
                                >
                                    {typeof row[col.name] === "boolean" ? row[col.name].toString() : row[col.name]}
                                </td>
                            ))}
                        </tr>
                    );
                })}
                </tbody>

            </table>
        </div>
            <div className="action-bar">
                {actionType === null &&
                <div className="placeholder-text">{actionMessage}</div>
                }

                {actionType === "add" && (
                    <div className="add-wrapper">
                        {errorMessage &&
                            <div className="error-message">{errorMessage}</div>
                        }
                    <div className="add">
                        <div className="input-row" style={{ display: "flex", gap: "1rem" }}>
                            {headers.map((col, index) => (
                                <div key={index} className="input-cell">
                                    <label>{col.name}</label>
                                    <input
                                        type="text"
                                        placeholder={col.name === "id" ? "auto" : ""}
                                        value={newRecord[col.name] || ""}
                                        onChange={(e) => setNewRecord((prev) => ({ ...prev, [col.name]: e.target.value }))}
                                    />
                                </div>
                            ))}
                        </div>

                    </div>
                        <div className="add-buttons">
                        <button style={{backgroundColor: "deeppink"}} onClick={handleAddRecord}>Submit</button>
                        <button onClick={actionCancel}>Cancel</button>
                        </div>
                    </div>
                )}



                {actionType === "remove" &&
                    <div className="delete">
                    <div className="placeholder-text">Delete the selected row?</div>
                    <button onClick={actionCancel}>Cancel</button>
                        <button onClick={() =>deleteRow(focusedIndex)} style={{backgroundColor: "deeppink"}}>Delete</button>
                    </div>

                }

                {actionType === "add-column" &&
                    <div className="add-column">
                        {errorMessage &&
                            <div className="error-message">{errorMessage}</div>
                        }
                        <input
                            placeholder="Column name"
                            value={newColumn.name || ""}
                            onChange={(e) => updateColumn("name", e.target.value)}
                        />

                        <input
                            placeholder="DEFAULT"
                            value={newColumn.default || ""}
                            onChange={(e) => updateColumn("default", e.target.value)}
                        />

                        <select
                            value={newColumn.type || ""}
                            onChange={(e) => updateColumn("type", e.target.value)}
                        >
                            {columnTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <button onClick={actionCancel}>Cancel</button>
                        <button onClick={addColumn} style={{backgroundColor: "deeppink"}}>Add</button>
                    </div>
                }

                {actionType === "edit" && focusedIndex !== null && (
                    <div className="edit-wrapper">
                        {errorMessage &&
                            <div className="error-message">{errorMessage}</div>
                        }
                        <div className="edit">
                            <div className="input-row" style={{ display: "flex", gap: "1rem" }}>
                                {headers.map((col, index) => {
                                    if (col.name === "id") return null;
                                    return (
                                        <div key={index} className="input-cell">
                                            <label>{col.name}</label>
                                            <input
                                                type="text"
                                                placeholder={data[focusedIndex][col.name] ?? ""}
                                                value={newRecord[col.name] || ""}
                                                onChange={(e) =>
                                                    setNewRecord(prev => ({ ...prev, [col.name]: e.target.value }))
                                                }
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="edit-buttons">
                            <button
                                style={{ backgroundColor: "deeppink" }}
                                onClick={handleEditRecord}
                            >
                                Submit
                            </button>
                            <button onClick={actionCancel}>Cancel</button>
                        </div>
                    </div>
                )}

                {actionType === "remove-column" && (
                    <div className="remove-column-wrapper">
                        {errorMessage && <div className="error-message">{errorMessage}</div>}

                        <select
                            value={newColumn.name || ""}
                            onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                        >
                            <option value="">-- Select column --</option>
                            {headers
                                .filter(col => col.name !== "id")
                                .map(col => (
                                    <option key={col.name} value={col.name}>
                                        {col.name}
                                    </option>
                                ))
                            }
                        </select>

                        <div className="remove-column-buttons" style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                            <button style={{ backgroundColor: "deeppink" }} onClick={handleRemoveColumn}>Delete</button>
                            <button onClick={actionCancel}>Cancel</button>
                        </div>
                    </div>
                )}


            </div>
        </div>

    );

}



export default Table;