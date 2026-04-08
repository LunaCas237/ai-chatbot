export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface Message {
  role: "user" | "model";
  parts: MessagePart[];
  timestamp?: string;
}

export async function* sendMessageStream(
  history: Message[],
  message: string,
  image?: { mimeType: string; data: string },
  systemInstruction?: string
) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        history,
        message,
        image,
        systemInstruction,
      }),
    });

    const contentType = response.headers.get("Content-Type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error("The server is currently starting up or unavailable. Please wait a few seconds and try again.");
    }

    if (!response.ok) {
      let errorMessage = "Failed to connect to AI server";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the status text
        errorMessage = `Server Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
      yield `Error: ${error.message}`;
    } else {
      yield "An unexpected error occurred while communicating with the AI.";
    }
  }
}
