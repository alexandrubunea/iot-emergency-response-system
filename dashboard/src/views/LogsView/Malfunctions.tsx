import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import DOMPurify from "dompurify";
import { io } from "socket.io-client";
import { Malfunction } from "../../types/Malfunction";
import MalfunctionRow from "../../components/MalfunctionRow";
import { createMalfunctionsFromJson } from "../../utils/createObjectsFromJson";
import Pagination from "../../components/Pagination";
import { sweetAlert } from "../../utils/ui";

function Malfunctions() {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;
    const socketRef = useRef(
        io(API_URL, {
            transports: ["websocket"],
        })
    );

    const resultsPerPage = 10;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const [inputValue, setInputValue] = useState("");
    const [displayedMalfunctions, setDisplayedMalfunctions] = useState<Malfunction[]>([]);
    const original_malfunctions_full = useRef<Malfunction[]>([]);
    const filtered_malfunctions_full = useRef<Malfunction[]>([]);

    const { data, isPending, isError, isSuccess } = useQuery({
        queryKey: ["malfunctions"],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/api/malfunctions`);
            return response.data;
        },
        staleTime: 5000,
    });

    const updateDisplayedData = (currentPage: number) => {
        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        setDisplayedMalfunctions(filtered_malfunctions_full.current.slice(startIndex, endIndex));
        setPage(currentPage);
    };

    const applyCurrentFilterAndPaginate = (searchTerm: string) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        if (!searchTerm || !/\S/.test(searchTerm)) {
            filtered_malfunctions_full.current = [...original_malfunctions_full.current];
        } else {
            filtered_malfunctions_full.current = original_malfunctions_full.current.filter(
                (malfunction) =>
                    malfunction.business_name.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        const newTotalPages = Math.ceil(filtered_malfunctions_full.current.length / resultsPerPage);
        setTotalPages(newTotalPages);
        updateDisplayedData(1);
    };

    useEffect(() => {
        if (isSuccess && data) {
            const malfunctions_json: Array<Malfunction> = createMalfunctionsFromJson(data);
            original_malfunctions_full.current = malfunctions_json;
            applyCurrentFilterAndPaginate(DOMPurify.sanitize(inputValue));
        }
    }, [isSuccess, data]);

    useEffect(() => {
        const socket = socketRef.current;
        const currentSearchTerm = DOMPurify.sanitize(inputValue).toLowerCase();

        const handleUpdateMalfunctions = (malfunctionData: Malfunction) => {
            original_malfunctions_full.current = [malfunctionData, ...original_malfunctions_full.current];

            if (!currentSearchTerm || !/\S/.test(currentSearchTerm)) {
                 filtered_malfunctions_full.current = [...original_malfunctions_full.current];
            } else {
                filtered_malfunctions_full.current = original_malfunctions_full.current.filter(
                     (malfunction) =>
                         malfunction.business_name.toLowerCase().includes(currentSearchTerm)
                 );
            }

             const newTotalPages = Math.ceil(filtered_malfunctions_full.current.length / resultsPerPage);
             setTotalPages(newTotalPages);
             updateDisplayedData(page);
        };

        socket.on("update-malfunctions", handleUpdateMalfunctions);

        return () => {
            socket.off("update-malfunctions", handleUpdateMalfunctions);
        };
    }, [inputValue, page]);

    const searchBusiness = (event?: React.FormEvent<HTMLFormElement>) => {
         if (event) {
             event.preventDefault();
         }
         const sanitizedInput = DOMPurify.sanitize(inputValue);
         applyCurrentFilterAndPaginate(sanitizedInput);
     };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            updateDisplayedData(newPage);
        }
    };

    const onSolve = (malfunctionId: number) => {
        axios
            .post(`${API_URL}/api/solve_malfunction/${malfunctionId}`)
            .then(() => {
                original_malfunctions_full.current = original_malfunctions_full.current.filter(
                    (malfunction) => malfunction.id !== malfunctionId
                );
                filtered_malfunctions_full.current = filtered_malfunctions_full.current.filter(
                    (malfunction) => malfunction.id !== malfunctionId
                );

                const newTotalPages = Math.ceil(filtered_malfunctions_full.current.length / resultsPerPage);
                setTotalPages(newTotalPages);

                let nextPage = page;
                if (page > newTotalPages) {
                    nextPage = Math.max(1, newTotalPages);
                }

                updateDisplayedData(nextPage);

                sweetAlert("Malfunction Solved", "The malfunction has been marked as solved.", "success", "", "", false, false, 3000, null, null);
            })
            .catch(() => {
                sweetAlert("Error", "There was an error marking the malfunction as solved.", "error", "", "", false, false, 5000, null, null);
            });
    };

    let content;
    if (isPending) {
        content = (
            <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent mb-3"></div>
                     <h2 className="text-xl poppins-bold text-zinc-300">
                         Loading Malfunctions...
                     </h2>
                 </div>
             </div>
        );
    } else if (isError) {
        content = (
            <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center text-center">
                     <i className="fa-solid fa-triangle-exclamation text-3xl text-red-500 mb-3"></i>
                     <h2 className="text-xl poppins-bold text-zinc-300">
                         There was an error fetching data.
                     </h2>
                     <p className="text-zinc-400 mt-2 poppins-light">
                         We encountered an issue retrieving malfunctions data. Please try again later or contact support.
                     </p>
                 </div>
             </div>
        );
    } else if (isSuccess && original_malfunctions_full.current.length === 0) {
         content = (
             <div className="flex justify-center items-center h-40">
                 <div className="flex flex-col items-center text-center">
                     <i className="fa-solid fa-shield-heart text-3xl text-emerald-400 mb-3"></i>
                     <h2 className="text-xl poppins-bold text-zinc-300">
                         All Clear!
                     </h2>
                     <p className="text-zinc-400 mt-2 poppins-light">
                         No malfunctions found. Everything seems to be working correctly.
                     </p>
                 </div>
             </div>
         );
     } else if (isSuccess && filtered_malfunctions_full.current.length === 0) {
         content = (
            <div className="flex justify-center items-center h-40">
                 <div className="flex flex-col items-center text-center">
                     <i className="fa-solid fa-face-frown text-3xl text-zinc-500 mb-3"></i>
                     <h2 className="text-xl poppins-bold text-zinc-300">
                         No malfunctions found from this business.
                     </h2>
                     <p className="text-zinc-400 mt-2 poppins-light">
                         Your search did not match any business. Try adjusting your search terms.
                     </p>
                 </div>
             </div>
         );
     } else if (isSuccess && displayedMalfunctions.length > 0) {
         content = (
            <div className="space-y-3">
                 <h2 className="text-xl domine-bold mb-4">Search Results</h2>
                 {displayedMalfunctions.map((malfunction: Malfunction) => (
                     <MalfunctionRow key={malfunction._id} malfunction={malfunction} onSolve={() => onSolve(malfunction.id)} />
                 ))}
             </div>
         );
     } else {
         content = (
             <div className="flex justify-center items-center h-40">
                 <p className="text-zinc-400 mt-2 poppins-light">No malfunctions to display on this page.</p>
             </div>
         );
     }

    return (
        <>
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md">
                    <div className="flex items-center mb-3">
                         <h2 className="text-2xl domine-bold">Search Malfunctions</h2>
                    </div>
                    <form
                        method="POST"
                        onSubmit={searchBusiness}
                         className="flex flex-col sm:flex-row gap-3"
                    >
                        <input
                             className="flex-grow bg-zinc-700 text-zinc-200 rounded-md text-lg p-3 border border-zinc-600 focus:ring-0 focus:outline-0 placeholder-zinc-400 poppins-light"
                             value={inputValue}
                             onChange={handleInputChange}
                             placeholder="Business Name..."
                         />
                         <button
                            type="submit"
                            className="px-6 py-3 rounded-md poppins-bold uppercase bg-pink-600 hover:bg-pink-700 active:bg-pink-800 transition-colors duration-300 whitespace-nowrap hover:cursor-pointer flex flex-row space-x-2 items-center"
                         >
                             <i className="fa-solid fa-magnifying-glass mr-2"></i>
                             <span>Search</span>
                         </button>
                     </form>
                 </div>

                 <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md min-h-40">
                    {content}
                 </div>

                {isSuccess && totalPages > 1 && (
                    <Pagination
                         page={page}
                         totalPages={totalPages}
                         handlePageChange={handlePageChange}
                    />
                 )}
            </div>
        </>
    );
}

export default Malfunctions;
