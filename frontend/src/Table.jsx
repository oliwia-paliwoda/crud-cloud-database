import "./Table.scss";
import React, {useState, useEffect} from "react";
import TableElement from "./TableElement";


function Table({tableName, onReturn}){

    const [data, setData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [actionMessage, setActionMessage] = useState("Select a row to remove or edit it.");

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
            setActionMessage(data.message);

            if (data.inserted) {
                fetchTableData();
            }

            setNewRecord({});
            setActionType(null);

        } catch (err) {
            console.error(err);
        }
    };


    const [focusedIndex, setFocusedIndex] = useState(null);

    const [actionType, setActionType] = useState(null);
    const handleActionType=(action) => {
        setActionType(action);
    };

    const actionCancel = () => {
        setActionType(null);
        setFocusedIndex(null);
        setActionMessage("Select a row to remove or edit it.");
    }

    useEffect(() => {
        if(actionType === "add")
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
                    <button className="tool-button" onClick={() => handleActionType("add")}>Add record</button>
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
                    {headers.map((key) => (
                        <th
                            key={key}
                            style={{
                                border: "1px solid #333",
                                padding: "8px",
                                backgroundColor: "pink",
                                textTransform: "capitalize",
                            }}
                        >
                            {key}
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
                            {headers.map((key) => (
                                <td
                                    key={key}
                                    style={{
                                        border: "1px solid #333",
                                        padding: "8px",
                                        textAlign: "center",
                                    }}
                                >
                                    {row[key]}
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
                    <div className="add">
                        <div className="input-row" style={{ display: "flex", gap: "1rem" }}>
                            {headers
                                .map((name, index) => (
                                <div key={index} className="input-cell">
                                    <label style={{backgroundColor: "pink", borderRadius: "1vmin", padding: "1vmin"}}>{name}</label>
                                    <input
                                        type="text"
                                        placeholder={name === "id" ? "auto" : ""}
                                        value={newRecord[name] || ""}
                                        onChange={(e) =>
                                            setNewRecord((prev) => ({ ...prev, [name]: e.target.value }))
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                        <button style={{backgroundColor: "deeppink"}} onClick={handleAddRecord}>Submit</button>
                        <button onClick={actionCancel}>Cancel</button>
                    </div>
                )}



                {actionType === "remove" &&
                    <div className="delete">
                    <div className="placeholder-text">Delete the selected row?</div>
                    <button onClick={actionCancel}>Cancel</button>
                        <button onClick={() =>deleteRow(focusedIndex)} style={{backgroundColor: "deeppink"}}>Delete</button>
                    </div>

                }

                <div className="edit">
                    {actionType === "edit" &&
                        <div>
                            //todo
                        </div>}
                </div>

            </div>
        </div>

    );

}



export default Table;