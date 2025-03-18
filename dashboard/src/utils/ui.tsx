import Swal, { SweetAlertIcon } from "sweetalert2";

export function sweetAlert(
    title: string,
    text: string,
    icon: SweetAlertIcon | undefined,
    confirmButtonText: string,
    cancelButtonText: string,
    showCancelButton: boolean,
    showConfirmButton: boolean,
    timer: number,
    onConfirm: Function | null,
    onCancel: Function | null
) {
    Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonText: confirmButtonText,
        showConfirmButton: showConfirmButton,
        showCancelButton: showCancelButton,
        cancelButtonText: cancelButtonText,
        timer: timer,
        theme: "dark",
        customClass: {
            title: "poppins-black",
            confirmButton: "swal-confirm-button poppins-bold",
            cancelButton: "swal-cancel-button poppins-bold",
        },
    }).then((result) => {
        if (onConfirm && result.isConfirmed) onConfirm();
        else if (onCancel && !result.isConfirmed) onCancel();
    });
}
