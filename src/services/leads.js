/**
 * Service to handle Lead Integrations
 * Can be configured for Webhook (CRM) or EmailJS
 */

// CONFIGURATION
// ------------------------------------------------------------------
// Option 1: Webhook (Google Sheets, Zapier, n8n, RD Station)
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxvinNteBES3YIy6p188kJvvL-F7Gv7Aq60rIbWiKg740YnLxmg-Ck-MwALcRVfCv9thA/exec";

// Option 2: EmailJS
const EMAILJS_CONFIG = {
    serviceId: "",  // e.g., "service_xyz"
    templateId: "", // e.g., "template_abc"
    publicKey: "",  // e.g., "user_123"
};
// ------------------------------------------------------------------

/**
 * Sends user data to the configured external service.
 * @param {Object} user - The user object { name, email, phone, uid }
 */
export async function sendLeadToExternal(user) {
    if (!user) return;

    const leadData = {
        name: user.name || "Usuario",
        email: user.email,
        phone: user.phone,
        date: new Date().toISOString(),
        source: "App Koche"
    };

    console.log("Processing Lead:", leadData);

    try {
        // 1. WEBHOOK STRATEGY
        if (WEBHOOK_URL) {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(leadData)
            });
            console.log("Lead sent via Webhook!");
        }

        // 2. EMAILJS STRATEGY
        // Note: Requires emailjs-com package installed if we were using the SDK,
        // but we can also use their REST API to avoid extra dependencies if preferred,
        // or just add the dependency. For now, we'll assume the user might provide keys.
        if (EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.publicKey) {
            // Placeholder for EmailJS Logic
            console.log("EmailJS config found, but SDK not installed yet.");
        }

    } catch (error) {
        console.error("Failed to send lead to external service:", error);
        // We do NOT throw errors here to avoid blocking the user experience.
        // Failing to send a lead to CRM shouldn't stop the user from using the app.
    }
}
