import { useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function StatsGraph() {
    type TimeRange = "1 Year" | "6 Months" | "1 Month" | "1 Week" | "24h";

    const getLabelsForTimeRange = (range: TimeRange) => {
        const currentDate = new Date();
        let labels: string[] = [];

        switch (range) {
            case "1 Year":
                for (let i = 0; i < 12; i++) {
                    const date = new Date(currentDate);
                    date.setMonth(currentDate.getMonth() - (11 - i));
                    labels.push(
                        date.toLocaleString("default", { month: "long" })
                    );
                }
                break;

            case "6 Months":
                for (let i = 0; i < 6; i++) {
                    const date = new Date(currentDate);
                    date.setMonth(currentDate.getMonth() - (5 - i));
                    labels.push(
                        date.toLocaleString("default", { month: "long" })
                    );
                }
                break;

            case "1 Month":
                for (let i = 0; i < 30; i++) {
                    const date = new Date(currentDate);
                    date.setDate(currentDate.getDate() - (29 - i));
                    labels.push(
                        date.toLocaleString("default", {
                            weekday: "short",
                            day: "numeric",
                        })
                    );
                }
                break;

            case "1 Week":
                for (let i = 0; i < 7; i++) {
                    const date = new Date(currentDate);
                    date.setDate(currentDate.getDate() - (6 - i));
                    labels.push(
                        date.toLocaleString("default", { weekday: "short" })
                    );
                }
                break;

            case "24h":
                for (let i = 0; i < 24; i++) {
                    const date = new Date(currentDate);
                    date.setHours(currentDate.getHours() - (23 - i));
                    labels.push(
                        date.toLocaleString("default", {
                            hour: "numeric",
                            hour12: true,
                        })
                    );
                }
                break;

            default:
                break;
        }

        return labels;
    };

    // Mock-up data, will be removed when the connection with the db will be made
    const dataForTimeRanges: Record<TimeRange, number[][]> = {
        "1 Year": [
            [12, 13, 12, 10, 20, 30, 40, 50, 100, 20, 10, 5],
            [55, 23, 24, 46, 96, 100, 99, 87, 65, 43, 12, 5],
        ],
        "6 Months": [
            [15, 25, 20, 30, 40, 50],
            [50, 60, 70, 80, 90, 100],
        ],
        "1 Month": [
            [
                10, 20, 30, 20, 53, 59, 63, 5, 64, 11, 71, 36, 81, 58, 84, 56,
                29, 95, 7, 61, 76, 47, 55, 82, 1, 96, 23, 83, 100, 26,
            ],
            [
                20, 30, 40, 10, 38, 40, 25, 58, 30, 84, 100, 27, 56, 63, 89, 47,
                37, 92, 31, 19, 88, 76, 98, 41, 80, 21, 91, 33, 4, 61,
            ],
        ],
        "1 Week": [
            [5, 15, 20, 30, 40, 50, 60],
            [30, 20, 10, 15, 25, 35, 45],
        ],
        "24h": [
            [
                1, 2, 3, 4, 5, 6, 7, 20, 5, 23, 23, 40, 2, 5, 12, 16, 19, 20,
                11, 2, 3, 4, 5, 6,
            ],
            [
                7, 6, 5, 4, 3, 2, 1, 15, 4, 33, 30, 25, 1, 6, 10, 15, 17, 19,
                10, 1, 2, 3, 4, 5,
            ],
        ],
    };

    const [selectedRange, setSelectedRange] = useState<TimeRange>("1 Year");

    const labels = getLabelsForTimeRange(selectedRange);

    const data = {
        labels: labels,
        datasets: [
            {
                label: "Detected Fires",
                data: dataForTimeRanges[selectedRange][0],
                borderColor: "oklch(0.879 0.169 91.605)",
                backgroundColor: "oklch(0.879 0.169 91.605)",
                tension: 0.7,
            },
            {
                label: "Detected Intruders",
                data: dataForTimeRanges[selectedRange][1],
                borderColor: "oklch(0.408 0.153 2.432)",
                backgroundColor: "oklch(0.408 0.153 2.432)",
                tension: 0.7,
            },
        ],
    };

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                align: "center",
                labels: {
                    boxWidth: 12,
                    padding: 15,
                    font: {
                        size: 12,
                        family: "'Poppins', sans-serif"
                    },
                },
            },
            title: {
                display: true,
                position: "bottom",
                text: `Stats over the selected range: ${selectedRange}`,
                font: {
                    size: 14,
                    family: "'Poppins', sans-serif"
                },
                padding: {
                    top: 10,
                    bottom: 0,
                },
            },
            tooltip: {
                titleFont: {
                    size: 13,
                    family: "'Poppins', sans-serif"
                },
                bodyFont: {
                    size: 12,
                    family: "'Poppins', sans-serif"
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 0,
                    autoSkip: true,
                    font: {
                        size: (ctx) => {
                            const width = ctx.chart.width;
                            return width < 400 ? 8 : width < 600 ? 10 : 12;
                        },
                    },
                },
                grid: {
                    display: false,
                },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    font: {
                        size: (ctx) => {
                            const width = ctx.chart.width;
                            return width < 400 ? 8 : width < 600 ? 10 : 12;
                        },
                    },
                },
            },
        },
    };

    return (
        <div className="flex flex-col w-full">
            <div className="w-full overflow-x-auto pb-2">
                <ul className="flex space-x-2 poppins-light min-w-max mb-3">
                    {Object.keys(dataForTimeRanges).map((range) => (
                        <li
                            key={range}
                            onClick={() => setSelectedRange(range as TimeRange)}
                            className={`
                                p-2 md:p-3 rounded-md hover:bg-zinc-950 hover:cursor-pointer
                                text-center transition-colors duration-300 text-sm md:text-base
                                ${
                                    range === selectedRange
                                        ? "bg-pink-700"
                                        : "bg-zinc-900"
                                }
                            `}
                        >
                            {range}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="w-full h-64 sm:h-80 md:h-96">
                <Line options={options} data={data} />
            </div>
        </div>
    );
}

export default StatsGraph;
