import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function QuestionPanel() {
  const [question, setQuestion] = useState("");
  const [aiResponse, setAIResponse] = useState(null);
  const [listening, setListening] = useState(false);
  const timeoutRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice Input:", transcript);
        setQuestion(transcript);
        setListening(false);

        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          handleAsk(transcript);
        }, 3000);
      };

      recognition.onerror = (err) => {
        console.error("Speech Error", err);
        setListening(false);
      };

      recognitionRef.current = recognition;
    }

    const message = "You can ask any question about your purchase";
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-IN";
    speechSynthesis.speak(utterance);

    return () => {
      clearTimeout(timeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleVoice = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    setQuestion("");
    setAIResponse(null);
    setListening(true);
    recognitionRef.current.start();
  };

  const handleAsk = async (q) => {
    const query = q || question;
    if (!query.trim()) return;

    try {
      const res = await axios.get("http://localhost:5001/question", {
        params: { message: query },
      });
      setAIResponse(res.data);
      
      // Speak the summary response
      if (res.data.objectResult?.summary) {
        const utterance = new SpeechSynthesisUtterance(res.data.objectResult.summary);
        utterance.lang = "en-IN";
        speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="mt-8 p-6 border rounded-md shadow-md bg-white max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Ask a Question</h2>
      <p className="text-gray-600 mb-4">
        💬 You can ask any question about your purchase.
      </p>

      <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type or use mic to ask..."
          className="w-full sm:w-3/4 border border-gray-300 rounded px-4 py-2"
        />
        <button
          onClick={handleVoice}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          🎤 {listening ? "Listening..." : "Speak"}
        </button>
      </div>

      {/* Mic Indicator */}
      {listening && (
        <div className="flex flex-col items-center justify-center mt-2 mb-4">
          <div className="w-12 h-12 animate-ping rounded-full bg-red-500 opacity-75 mb-1"></div>
          <p className="text-red-600 font-medium">Listening...</p>
        </div>
      )}

      {!listening && !aiResponse && (
        <button
          onClick={() => handleAsk()}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition mb-4"
        >
          Ask ➡️
        </button>
      )}

      {/* Response Output */}
      {aiResponse && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">🧾 AI Response</h3>
          <h4 className="mt-4 font-medium">Data:</h4>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto text-sm">
            {JSON.stringify(aiResponse.result, null, 2)}
          </pre>
          
          {/* Add a button to ask another question */}
          <button
            onClick={() => {
              setAIResponse(null);
              setQuestion("");
            }}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            🎤 Ask Another Question
          </button>
        </div>
      )}
    </div>
  );
}