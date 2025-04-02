import { useState } from "react";
import DOMPurify from "dompurify";
import { sweetAlert } from "../utils/ui";

type AddNewEmployeeProps = {
    toggleFunction: () => void;
    setToggleState: React.Dispatch<React.SetStateAction<boolean>>;
};

function AddNewEmployee({
    toggleFunction,
    setToggleState,
}: AddNewEmployeeProps) {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
    });

    const [formErrors, setFormErrors] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
    });

    const handleFormChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors({
                ...formErrors,
                [name]: "",
            });
        }
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = { ...formErrors };

        if (!formData.first_name.trim()) {
            newErrors.first_name = "First name is required";
            valid = false;
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = "Last name is required";
            valid = false;
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
            valid = false;
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
            valid = false;
        }

        if (
            formData.phone &&
            !/^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/.test(
                formData.phone
            )
        ) {
            newErrors.phone = "Invalid phone number format";
            valid = false;
        }

        if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
            valid = false;
        }

        setFormErrors(newErrors);
        return valid;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_EXPRESS_API_URL;
            const sanitizedData = {
                first_name: DOMPurify.sanitize(formData.first_name),
                last_name: DOMPurify.sanitize(formData.last_name),
                phone: DOMPurify.sanitize(formData.phone),
                email: DOMPurify.sanitize(formData.email),
            };

            const response = await fetch(`${API_URL}/api/employees`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sanitizedData),
            });

            if (!response.ok) {
                throw new Error(
                    `Error: ${response.status} - ${response.statusText}`
                );
            }

            setFormData({
                first_name: "",
                last_name: "",
                phone: "",
                email: "",
            });
            setToggleState(false);

            sweetAlert(
                "Employee added successfully",
                "",
                "success",
                "",
                "",
                false,
                false,
                3000,
                null,
                null
            );
        } catch (error) {
            console.error("Failed to add employee:", error);

            sweetAlert(
                "Something went wrong!",
                "",
                "error",
                "",
                "",
                false,
                false,
                5000,
                null,
                null
            );
        }
    };

    return (
        <>
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md">
                    <div className="flex items-center mb-3">
                        <h2 className="text-2xl domine-bold">
                            Add New Employee
                        </h2>
                    </div>
                    <hr className="my-5 border-zinc-600"></hr>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="mb-4">
                            <h3 className="text-xl mb-4 domine-bold text-emerald-400">
                                Personal Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-zinc-300 mb-1 poppins-bold">
                                        First Name{" "}
                                        <span className="text-pink-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleFormChange}
                                        className={`w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border ${
                                            formErrors.first_name
                                                ? "border-red-500"
                                                : "border-zinc-600"
                                        } focus:ring-0 focus:outline-0 poppins-light`}
                                        placeholder="Enter first name"
                                    />
                                    {formErrors.first_name && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formErrors.first_name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-zinc-300 mb-1 poppins-bold">
                                        Last Name{" "}
                                        <span className="text-pink-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleFormChange}
                                        className={`w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border ${
                                            formErrors.last_name
                                                ? "border-red-500"
                                                : "border-zinc-600"
                                        } focus:ring-0 focus:outline-0 poppins-light`}
                                        placeholder="Enter last name"
                                    />
                                    {formErrors.last_name && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formErrors.last_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-xl mb-4 domine-bold text-emerald-400">
                                Contact Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-zinc-300 mb-1 poppins-bold">
                                        Phone Number{" "}
                                        <span className="text-pink-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleFormChange}
                                        className={`w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border ${
                                            formErrors.phone
                                                ? "border-red-500"
                                                : "border-zinc-600"
                                        } focus:ring-0 focus:outline-0 poppins-light`}
                                        placeholder="Enter phone number"
                                    />
                                    {formErrors.phone && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formErrors.phone}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-zinc-300 mb-1 poppins-bold">
                                        Email Address{" "}
                                        <span className="text-pink-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        className={`w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border ${
                                            formErrors.email
                                                ? "border-red-500"
                                                : "border-zinc-600"
                                        } focus:ring-0 focus:outline-0 poppins-light`}
                                        placeholder="Enter email address"
                                    />
                                    {formErrors.email && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formErrors.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-zinc-600">
                            <button
                                type="button"
                                onClick={toggleFunction}
                                className="px-6 py-3 rounded-md poppins-bold uppercase bg-zinc-600 hover:bg-zinc-700 active:bg-zinc-800 transition-colors duration-300 whitespace-nowrap hover:cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-md poppins-bold uppercase bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 transition-colors duration-300 whitespace-nowrap hover:cursor-pointer flex items-center justify-center"
                            >
                                <i className="fa-solid fa-floppy-disk mr-2"></i>
                                <span>Save Employee</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default AddNewEmployee;
