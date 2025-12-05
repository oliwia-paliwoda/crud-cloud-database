import "./AllTables.scss"
import TableElement from "./TableElement";
import Table from "./Table";
import React, {useState} from "react";
function AllTables(){

    const tables = [];

    const [showDetails, setShowDetails] = useState(false);
    const [activeTable, setActiveTable] = useState(null);

    const handleClick = (name) => {
        setShowDetails(true);
        setActiveTable(name);
    }

    const handleReturn = () => {
        setShowDetails(false);
    };

    const [actionType, setActionType] = useState(null);
    const handleActionType=(action) => {
        setActionType(action);
    };

    const [focusedTable, setFocusedTable] = useState(null);
    const handleSelectTable = (focusedTable) => {
        setFocusedTable(focusedTable);
    };

    return (
        <div className="container">
            {!showDetails &&
            <div className="table-view">

                {actionType === null && <div className="table-list">
                {tables.map((name,index) => (<TableElement onClick={() => handleClick(name)} key={index} tableName={name} />))}

            </div>}

                {actionType === "remove" && <div className="table-list">
                    {tables.map((name, index) => (
                        <TableElement
                            onClick={() => handleSelectTable(name)}
                            key={index}
                            tableName={name}
                            isFocused={focusedTable === name}
                        />
                    ))}                </div>
                }

            <div className="manage-tables">
                <button onClick={ () => handleActionType("add")}>Add table</button>
                <button onClick={ () => handleActionType("remove")}>Remove table</button>
            </div>
                <div className="action-bar-tables">


                    {actionType === "remove" &&
                        <div className="action-bar-remove">

                        </div>
                    }


                    {actionType === "add" &&
                        <div>add</div>
                    }
                </div>
            </div>
            }

            {showDetails &&
            <div className="details-view">
                <Table tableName={activeTable} onReturn={handleReturn}></Table>
            </div>
            }
        </div>
    );
}


export default AllTables