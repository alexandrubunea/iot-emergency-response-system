import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
    ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface ApiDataset {
    label: string;
    data: number[];
}

interface ApiResponseData {
    labels: string[];
    datasets: ApiDataset[];
}

interface ApiResponse {
    status: string;
    data?: ApiResponseData;
    message?: string;
}

type TimeRangeDisplay = "1 Year" | "6 Months" | "1 Month" | "1 Week" | "24h";
type TimeRangeApi = "1y" | "6m" | "1m" | "1w" | "24h";

const timeRangeMapping: Record<TimeRangeDisplay, TimeRangeApi> = {
    "1 Year": "1y",
    "6 Months": "6m",
    "1 Month": "1m",
    "1 Week": "1w",
    "24h": "24h",
};

const datasetStyles = [
    {
        label: "Detected Fires",
        borderColor: "oklch(0.879 0.169 91.605)",
        backgroundColor: "oklch(0.879 0.169 91.605)",
        tension: 0.7,
    },
    {
        label: "Detected Intruders",
        borderColor: "oklch(0.408 0.153 2.432)",
        backgroundColor: "oklch(0.408 0.153 2.432)",
        tension: 0.7,
    },
];

const fetchStatsData = async (
    range: TimeRangeApi
): Promise<ApiResponseData> => {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;

    try {
        const response = await axios.get<ApiResponse>(
            `${API_URL}/api/alerts_over_time/${range}`
        );

        if (response.data.status === "success" && response.data.data) {
            const formattedData = {
                ...response.data.data,
            };
            return formattedData;
        } else {
            throw new Error(
                response.data.message || "Failed to fetch stats data"
            );
        }
    } catch (error) {
        console.error("Error fetching stats data:", error);
        if (axios.isAxiosError(error)) {
            throw new Error(
                error.response?.data?.message ||
                    error.message ||
                    "Network or server error"
            );
        }
        throw new Error("An unknown error occurred while fetching data.");
    }
};

function StatsGraph() {
    const [selectedRange, setSelectedRange] =
        useState<TimeRangeDisplay>("1 Year");

    const apiRange = timeRangeMapping[selectedRange];

    const {
        data: queryData,
        isLoading,
        isError,
        error,
    } = useQuery<ApiResponseData, Error>({
        queryKey: ["statsData", apiRange],
        queryFn: () => fetchStatsData(apiRange),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
    });

    const chartData: ChartData<"line"> = {
        labels: queryData?.labels ?? [],
        datasets:
            queryData?.datasets.map((apiDataset) => {
                const style =
                    datasetStyles.find((s) => s.label === apiDataset.label) ||
                    {};
                return {
                    ...style,
                    data: apiDataset.data,
                    label: apiDataset.label,
                };
            }) ?? [],
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
                        family: "'Poppins', sans-serif",
                    },
                },
            },
            title: {
                display: true,
                position: "bottom",
                text: `Stats over the selected range: ${selectedRange}`,
                font: {
                    size: 14,
                    family: "'Poppins', sans-serif",
                },
                padding: {
                    top: 10,
                    bottom: 0,
                },
            },
            tooltip: {
                titleFont: {
                    size: 13,
                    family: "'Poppins', sans-serif",
                },
                bodyFont: {
                    size: 12,
                    family: "'Poppins', sans-serif",
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
                            const width = ctx?.chart?.width ?? 0;
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
                            const width = ctx?.chart?.width ?? 0;
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
                <ul className="flex flex-col md:flex-row gap-2 poppins-light min-w-max mb-3 items-center">
                    {(Object.keys(timeRangeMapping) as TimeRangeDisplay[]).map(
                        (range) => (
                            <li
                                key={range}
                                onClick={() => setSelectedRange(range)}
                                className={`
                                p-2 md:p-3 rounded-md hover:bg-zinc-900 active:bg-zinc-950 hover:cursor-pointer w-full md:w-36
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
                        )
                    )}
                </ul>
            </div>

            <div className="w-full h-64 sm:h-80 md:h-96">
                {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        Loading chart data...
                    </div>
                )}
                {isError && (
                    <div className="flex items-center justify-center h-full text-red-500">
                        Error loading data: {error?.message ?? "Unknown error"}
                    </div>
                )}
                {!isLoading && !isError && queryData && (
                    <Line options={options} data={chartData} />
                )}
                {!isLoading && !isError && !queryData && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No data available for the selected range.
                    </div>
                )}
            </div>
        </div>
    );
}

export default StatsGraph;
