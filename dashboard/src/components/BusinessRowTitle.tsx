import { useState, useEffect } from "react";

type BusinessRowTitleProps = {
    text: string;
    alert: boolean;
    malfunction: boolean;
};

function BusinessRowTitle({ text, alert, malfunction }: BusinessRowTitleProps) {
    const [shakeAnimation, setShakeAnimation] = useState(true);

    useEffect(() => {
        let seconds = 0;

        const interval = setInterval(() => {
            seconds += 1;
            if (!shakeAnimation && seconds < 5) return;

            setShakeAnimation((prev) => !prev);
            seconds = 0;
        }, 1000);

        return () => clearInterval(interval);
    }, [shakeAnimation]);

    return (
        <>
            <h1
                className={`text-lg md:text-2xl poppins-black flex flex-row space-x-2 items-center ${
                    alert && shakeAnimation
                        ? "animate__animated animate__headShake"
                        : ""
                }`}
            >
                {alert && (
                    <i className="fa-solid fa-land-mine-on text-xl text-red-500"></i>
                )}
                {malfunction && (
                    <i className="fa-solid fa-bug text-2xl text-amber-500"></i>
                )}
                <span>{text}</span>
            </h1>
        </>
    );
}

export default BusinessRowTitle;
