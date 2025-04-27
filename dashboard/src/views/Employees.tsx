import { useState } from "react";
import EmployeesList from "../components/EmployeesList";
import AddNewEmployee from "../components/AddNewEmployee";

function Employees() {

    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const toggleAddEmployeeView = () => {
        setShowAddEmployee(!showAddEmployee);
    }

    return (
        <>
            {!showAddEmployee && (
                <EmployeesList toggleFunction={toggleAddEmployeeView} />
            )}
            {showAddEmployee && (
                <AddNewEmployee toggleFunction={toggleAddEmployeeView} setToggleState={setShowAddEmployee} />
            )}
        </>
    )
}

export default Employees;
