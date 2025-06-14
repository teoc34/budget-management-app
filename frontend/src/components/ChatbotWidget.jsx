import { useEffect } from "react";

const ChatbotWidget = () => {
    useEffect(() => {
        // Injectăm scriptul JS doar o dată
        const script = document.createElement("script");
        script.src = "https://cdn.botpress.cloud/webchat/v3.0/inject.js";
        script.async = true;
        document.head.appendChild(script);

        // Când scriptul e gata, inițializăm botul
        script.onload = () => {
            window.botpress.on("webchat:ready", () => {
                window.botpress.open(); // Deschide chat-ul automat
            });

            window.botpress.init({
                botId: "d7c61b6c-66bb-4ae4-9b01-af49d92e737a", // ← botul tău real
                clientId: "93ff640a-9a4b-4894-9ea7-f2abec8a2516", // ← clientId real
                selector: "#webchat",
                configuration: {
                    website: {},
                    email: {},
                    phone: {},
                    termsOfService: {},
                    privacyPolicy: {}
                }
            });
        };
    }, []);

    return (
        <div>
            <div id="webchat" style={{ width: 0, height: 0 }} />

        </div>
    );
};

export default ChatbotWidget;
