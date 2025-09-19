/**
 * Simula el envío de una cotización por correo electrónico a través de una API.
 * En una aplicación real, esto haría una llamada a un backend (ej. usando fetch)
 * que se encargaría de enviar el correo a través de un servicio como SendGrid, Resend, etc.
 * 
 * @param recipientEmail El correo electrónico del destinatario.
 * @param quoteMessage El cuerpo del mensaje de la cotización.
 * @returns Una promesa que se resuelve con un objeto indicando el éxito y un mensaje.
 */
export const sendEmailQuote = async (
    recipientEmail: string,
    quoteMessage: string
): Promise<{ success: boolean; message: string }> => {
    
    console.log("--- SIMULANDO ENVÍO DE CORREO ---");
    console.log("Para:", recipientEmail);
    console.log("Mensaje:", quoteMessage);
    console.log("---------------------------------");

    // Simular un retraso de red de 1.5 segundos
    await new Promise(resolve => setTimeout(resolve, 1500));

    // En una aplicación real, aquí manejarías posibles errores del servidor.
    // Para esta simulación, siempre devolveremos éxito.
    if (recipientEmail && quoteMessage) {
        return {
            success: true,
            message: 'Correo enviado exitosamente.'
        };
    } else {
        return {
            success: false,
            message: 'Faltan datos para enviar el correo.'
        };
    }
};
