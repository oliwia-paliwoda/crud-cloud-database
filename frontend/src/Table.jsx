import "./Table.scss";
import React, {useState, useEffect} from "react";
import TableElement from "./TableElement";


function Table({tableName, onReturn}){

    const data = [
        { imie: "Jan", nazwisko: "Kowalski", wiek: 25 },
        { imie: "Anna", nazwisko: "Nowak", wiek: 30 },
        { imie: "Piotr", nazwisko: "Wiśniewski", wiek: 28 },
        { imie: "Katarzyna", nazwisko: "Wójcik", wiek: 22 },
        { imie: "Marek", nazwisko: "Lewandowski", wiek: 35 }
    ];


    const [newRecord, setNewRecord] = useState({});

    const handleAddRecord = () => {
        console.error("Dodany rekord:", newRecord);
        setNewRecord({});
    };


    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    const [focusedIndex, setFocusedIndex] = useState(null);

    const [actionType, setActionType] = useState(null);
    const handleActionType=(action) => {
        setActionType(action);
    };

    const actionCancel = () => {
        setActionType(null);
        setFocusedIndex(null);
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
                <div className="placeholder-text">Select a row to remove or edit it. </div>
                }

                {actionType === "add" && (
                    <div className="add">
                        <div className="input-row" style={{ display: "flex", gap: "1rem" }}>
                            {headers.map((name, index) => (
                                <div key={index} className="input-cell">
                                    <label style={{backgroundColor: "pink", borderRadius: "1vmin", padding: "1vmin"}}>{name}</label>
                                    <input
                                        type="text"
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
                        <button style={{backgroundColor: "deeppink"}}>Delete</button>
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