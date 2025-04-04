type PaginationProps = {
    page: number;
    totalPages: number;
    handlePageChange: (page: number) => void;
};

function Pagination({ page, totalPages, handlePageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const renderPageButton = (pageNum: number, isCurrentPage = false) => {
        if (isCurrentPage) {
            return (
                <span
                    aria-current="page"
                    className="w-10 h-10 flex items-center justify-center rounded-md text-lg poppins-light bg-rose-500/40"
                >
                    {pageNum}
                </span>
            );
        }

        return (
            <button
                onClick={() => handlePageChange(pageNum)}
                type="button"
                aria-label={`Go to page ${pageNum}`}
                className="w-10 h-10 flex items-center justify-center rounded-md text-lg poppins-light bg-zinc-700 hover:bg-zinc-900 active:bg-zinc-950 transition-colors duration-300 hover:cursor-pointer"
            >
                {pageNum}
            </button>
        );
    };

    const renderEllipsis = (key: string) => (
        <span
            key={`ellipsis-${key}`}
            className="w-10 h-10 flex items-center justify-center rounded-md text-lg poppins-light bg-zinc-700"
            aria-hidden="true"
        >
            …
        </span>
    );

    const getPageNumbers = () => {
        let pages = [];

        if (page > 2) {
            pages.push(renderPageButton(1));
        }

        if (page > 3) {
            pages.push(renderEllipsis("start"));
        }

        if (page > 1) {
            pages.push(renderPageButton(page - 1));
        }

        pages.push(renderPageButton(page, true));

        if (page < totalPages - 1) {
            pages.push(renderPageButton(page + 1));
        }

        if (page < totalPages - 2) {
            pages.push(renderEllipsis("end"));
        }

        if (page < totalPages) {
            pages.push(renderPageButton(totalPages));
        }

        return pages;
    };

    return (
        <div
            aria-label="Pagination"
            className="rounded-lg bg-zinc-800 text-zinc-200 p-4 shadow-md"
        >
            <div className="flex flex-wrap justify-center items-center gap-2">
                {getPageNumbers()}
            </div>
            <div className="text-center text-xs mt-2 text-zinc-400">
                Page {page} of {totalPages}
            </div>
        </div>
    );
}

export default Pagination;
