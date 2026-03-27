export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { message } = req.body;

    // test reply
    let reply = "I didn't understand 🤔";

    if (message.toLowerCase().includes("book")) {
        reply = "Sure! What day would you like?";
    }

    if (message.toLowerCase().includes("hello")) {
        reply = "Hey 👋 How can I help you?";
    }

    res.status(200).json({ reply });
}