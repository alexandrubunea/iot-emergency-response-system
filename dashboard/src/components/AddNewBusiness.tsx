import { useState } from "react";
import DOMPurify from "dompurify";
import { sweetAlert } from "../utils/ui";

type AddNewBusinessProps = {
    toggleFunction: () => void,
    setToggleState: React.Dispatch<React.SetStateAction<boolean>>
}

function AddNewBusiness({toggleFunction, setToggleState}: AddNewBusinessProps) {
    const [formData, setFormData] = useState({
        businessName: "",
        latitude: "",
        longitude: "",
        address: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
    });

    const [formErrors, setFormErrors] = useState({
        businessName: "",
        latitude: "",
        longitude: "",
        address: "",
        contactEmail: "",
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

        if (!formData.businessName.trim()) {
            newErrors.businessName = "Business name is required";
            valid = false;
        }

        if (!formData.latitude.trim()) {
            newErrors.latitude = "Latitude is required";
            valid = false;
        } else if (
            isNaN(Number(formData.latitude)) ||
            Number(formData.latitude) < -90 ||
            Number(formData.latitude) > 90
        ) {
            newErrors.latitude = "Must be a valid latitude (-90 to 90)";
            valid = false;
        }

        if (!formData.longitude.trim()) {
            newErrors.longitude = "Longitude is required";
            valid = false;
        } else if (
            isNaN(Number(formData.longitude)) ||
            Number(formData.longitude) < -180 ||
            Number(formData.longitude) > 180
        ) {
            newErrors.longitude = "Must be a valid longitude (-180 to 180)";
            valid = false;
        }

        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
            valid = false;
        }

        if (
            formData.contactEmail &&
            !/^\S+@\S+\.\S+$/.test(formData.contactEmail)
        ) {
            newErrors.contactEmail = "Invalid email format";
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
            const API_URL = import.meta.env.VITE_API_URL;
            const sanitizedData = {
                name: DOMPurify.sanitize(formData.businessName),
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                address: DOMPurify.sanitize(formData.address),
                contactName: DOMPurify.sanitize(formData.contactName),
                contactPhone: DOMPurify.sanitize(formData.contactPhone),
                contactEmail: DOMPurify.sanitize(formData.contactEmail),
            };

            const response = await fetch(`${API_URL}/api/businesses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sanitizedData),
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            setFormData({
                businessName: "",
                latitude: "",
                longitude: "",
                address: "",
                contactName: "",
                contactPhone: "",
                contactEmail: "",
            });
            setToggleState(false);

            sweetAlert(
                "Business profile created successfully!",
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
            console.error("Failed to add business:", error);

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
                        <h2 className="text-2xl domine-bold">Add Business</h2>
                    </div>
                    <hr className="my-5 border-zinc-600"></hr>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="mb-4">
                            <h3 className="text-xl mb-4 domine-bold text-emerald-400">
                                Business Information
                            </h3>

                            <div className="mb-4">
                                <label className="block text-zinc-300 mb-1 poppins-bold">
                                    Business Name{" "}
                                    <span className="text-pink-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleFormChange}
                                    className={`w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border ${
                                        formErrors.businessName
                                            ? "border-red-500"
                                            : "border-zinc-600"
                                    } focus:ring-0 focus:outline-0 poppins-light`}
                                    placeholder="Enter business name"
                                />
                                {formErrors.businessName && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {formErrors.businessName}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-zinc-300 mb-1 poppins-bold">
                                        Latitude{" "}
                                        <span className="text-pink-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="latitude"
                                        value={formData.latitude}
                                        onChange={handleFormChange}
                                        className={`w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border ${
                                            formErrors.latitude
                                                ? "border-red-500"
                                                : "border-zinc-600"
                                        } focus:ring-0 focus:outline-0 poppins-light`}
                                        placeholder="e.g. 44.63255"
                                    />
                                    {formErrors.latitude && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formErrors.latitude}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-zinc-300 mb-1 poppins-bold">
                                        Longitude{" "}
                                        <span className="text-pink-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="longitude"
                                        value={formData.longitude}
                                        onChange={handleFormChange}
                                        className={`w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border ${
                                            formErrors.longitude
                                                ? "border-red-500"
                                                : "border-zinc-600"
                                        } focus:ring-0 focus:outline-0 poppins-light`}
                                        placeholder="e.g. 22.6556833"
                                    />
                                    {formErrors.longitude && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formErrors.longitude}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-zinc-300 mb-1 poppins-bold">
                                    Business Address{" "}
                                    <span className="text-pink-500">*</span>
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleFormChange}
                                    className={`w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border ${
                                        formErrors.address
                                            ? "border-red-500"
                                            : "border-zinc-600"
                                    } focus:ring-0 focus:outline-0 poppins-light`}
                                    placeholder="Enter full address"
                                    rows={3}
                                />
                                {formErrors.address && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {formErrors.address}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-xl mb-4 domine-bold text-emerald-400">
                                Contact Information (Optional)
                            </h3>

                            <div className="mb-4">
                                <label className="block text-zinc-300 mb-1 poppins-bold">
                                    Contact Name
                                </label>
                                <input
                                    type="text"
                                    name="contactName"
                                    value={formData.contactName}
                                    onChange={handleFormChange}
                                    className="w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border border-zinc-600 focus:ring-0 focus:outline-0 poppins-light"
                                    placeholder="Enter contact person's name"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-zinc-300 mb-1 poppins-bold">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="contactPhone"
                                        value={formData.contactPhone}
                                        onChange={handleFormChange}
                                        className="w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border border-zinc-600 focus:ring-0 focus:outline-0 poppins-light"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-300 mb-1 poppins-bold">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleFormChange}
                                        className={`w-full bg-zinc-700 text-zinc-200 rounded-md p-3 border ${
                                            formErrors.contactEmail
                                                ? "border-red-500"
                                                : "border-zinc-600"
                                        } focus:ring-0 focus:outline-0 poppins-light`}
                                        placeholder="Enter email address"
                                    />
                                    {formErrors.contactEmail && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {formErrors.contactEmail}
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
                                <span>Save Business</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default AddNewBusiness;
