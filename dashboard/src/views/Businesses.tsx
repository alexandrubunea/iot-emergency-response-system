import { useState } from "react";
import BusinesesList from "../components/BusinessesList";
import AddNewBusiness from "../components/AddNewBusiness";

function Businesses() {

    const [showAddBusiness, setShowAddBusiness] = useState(false);
    const toggleAddBusinessView = () => {
        setShowAddBusiness(!showAddBusiness);
    };

    return (
        <>
            {!showAddBusiness && (
                <BusinesesList toggleFunction={toggleAddBusinessView} />
            )}
            {showAddBusiness && (
                <AddNewBusiness toggleFunction={toggleAddBusinessView} setToggleState={setShowAddBusiness} />
            )}
        </>
    );
}

export default Businesses;
