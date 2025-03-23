import { useState, useEffect } from "react";

type BusinessRowTitleProps = {
    text: string;
    alert: boolean;
    malfunction: boolean;
};

function BusinessRowTitle({ text, alert, malfunction }: BusinessRowTitleProps) {
    const [shakeAnimation, setShakeAnimation] = useState(true);
    const [pulseAnimation, setPulseAnimation] = useState(true);

    useEffect(() => {
        if (!alert) return;

        const interval = setInterval(() => {
            setShakeAnimation((prev) => !prev);
        }, 3000);

        return () => clearInterval(interval);
    }, [alert]);

    useEffect(() => {
        if (!malfunction) return;

        const interval = setInterval(() => {
            setPulseAnimation((prev) => !prev);
        }, 2000);

        return () => clearInterval(interval);
    }, [malfunction]);


    return (
        <div className="flex items-center">
            <h1
                className={`text-lg md:text-xl poppins-black flex items-center gap-2
                ${
                    alert && shakeAnimation
                        ? "animate__animated animate__headShake"
                        : ""
                }
                ${
                    !alert && malfunction && pulseAnimation
                        ? "animate__animated animate__pulse"
                        : ""
                }`}
            >
                {alert && (
                    <div className="flex items-center justify-center">
                        <i className="fa-solid fa-bell text-lg text-red-500"></i>
                        <span className="absolute">
                            <i className="fa-solid fa-exclamation text-xs animate-ping"></i>
                        </span>
                    </div>
                )}

                {!alert && malfunction && (
                    <i className="fa-solid fa-triangle-exclamation text-lg text-amber-500"></i>
                )}

                {!alert && !malfunction && (
                    <i className="fa-solid fa-circle-check text-lg text-emerald-400"></i>
                )}

                <span className="truncate">{text}</span>

                {(alert || malfunction) && (
                    <span
                        className={`text-xs px-2 py-1 rounded-full ${
                            alert
                                ? "bg-red-900 text-red-200"
                                : "bg-amber-900 text-amber-200"
                        }`}
                    >
                        {alert ? "ALERT" : "ISSUE"}
                    </span>
                )}
            </h1>
        </div>
    );
}

export default BusinessRowTitle;
