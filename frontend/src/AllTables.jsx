import "./AllTables.scss"
import TableElement from "./TableElement";

function AllTables(){

    const tables = ["Users", "Projects", "Credentials", "Test"];

    return (
        <div className="container">
            <div className="table-list">
                {tables.map((name,index) => (<TableElement key={index} tableName={name}/>))}

            </div>
            <div className="manage-tables">
                <button>Add table</button>
                <button>Remove table</button>
            </div>
        </div>
    );
}


export default AllTables