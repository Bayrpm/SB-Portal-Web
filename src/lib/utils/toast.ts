import Swal from "sweetalert2";

export interface ToastConfig {
    title?: string;
    message: string;
    type?: "success" | "info" | "warning" | "error";
    duration?: number;
    icon?: string;
}

export function showToast({
    message,
    type = "info",
    duration = 3000,
    title,
}: ToastConfig) {
    Swal.fire({
        title: title,
        html: message,
        icon: type,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: duration,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
        customClass: {
            container: "toast-container",
            popup: "toast-popup",
            title: "toast-title",
            htmlContainer: "toast-message",
        },
    });
}

export function showNotification(message: string, type: "success" | "info" | "warning" | "error" = "info") {
    showToast({
        message,
        type,
        duration: 4000,
    });
}

export function notifyAssignment(folio: string, inspectorName?: string) {
    showToast({
        title: "✓ Asignación Completada",
        message: `Denuncia ${folio} ha sido asignada${inspectorName ? ` a ${inspectorName}` : ""
            }`,
        type: "success",
        duration: 3000,
    });
}

export function notifyStatusChange(folio: string, oldStatus: string, newStatus: string) {
    showToast({
        title: "🔄 Estado Actualizado",
        message: `Denuncia ${folio}: ${oldStatus} → ${newStatus}`,
        type: "info",
        duration: 3000,
    });
}

export function notifyRealtimeUpdate(changeType: "assignment" | "status" | "priority") {
    const messages = {
        assignment: "Nueva asignación detectada",
        status: "Cambio de estado detectado",
        priority: "Prioridad actualizada",
    };

    showToast({
        message: messages[changeType],
        type: "info",
        duration: 2000,
    });
}
