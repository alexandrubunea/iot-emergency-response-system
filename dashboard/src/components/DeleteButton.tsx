type DeleteButtonProps = {
    text: string;
    showConfirmation: () => void;
};

function DeleteButton({ text, showConfirmation }: DeleteButtonProps) {
    return (
        <>
            <button
                className="rounded-md p-3 uppercase poppins-bold hover:cursor-pointer text-zinc-200 bg-rose-700 hover:bg-rose-900 active:bg-rose-950  transition-colors duration-300 w-full"
                onClick={showConfirmation}
            >
                <i className="fa-solid fa-trash-can mr-1"></i>
                <span>{text}</span>
            </button>
        </>
    );
}

export default DeleteButton;
