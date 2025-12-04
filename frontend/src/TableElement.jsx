import "./TableElement.scss"

function TableElement({tableName, onClick}){
    return(
        <div onClick={onClick} className="table-container">{tableName}</div>
    );
}

export default TableElement