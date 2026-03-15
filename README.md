# Uzima Live | AI Health Assistant

Uzima Live is a real-time, multimodal AI health agent designed for the Uzima Mesh network. It provides personalized health guidance and medical document interpretation in both **English** and **Swahili**, leveraging Google's Gemini 2.5 Flash model via Genkit.

## 🌐 Live Demo

You can access the live application at: [https://studio--studio-9351178115-815ac.us-central1.hosted.app/](https://studio--studio-9351178115-815ac.us-central1.hosted.app/)

## 🚀 Key Features

- **Voice Assistant**: Tap to speak your health concerns and receive spoken advice in your preferred language.
- **Interactive Chat**: Type symptoms or questions to get medically grounded guidance with optional audio playback.
- **Document Scanner (Vision)**:
    - Live camera scanning for medical documents (prescriptions, lab reports, IDs).
    - PDF upload support for detailed interpretation.
    - Automatic text-to-speech explanations of findings.
- **Multilingual Support**: Seamless switching between English and Swahili for all AI interactions and audio responses.
- **Privacy First**: Health documents are processed securely and document data is purged from the client memory immediately after interpretation results are closed.
- **Community Grounded**: The AI uses internal tools to reference local community health trends (e.g., malaria outbreaks) to provide context-aware advice.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **AI Orchestration**: [Genkit](https://firebase.google.com/docs/genkit)
- **LLM**: Gemini 2.5 Flash (via `@genkit-ai/google-genai`)
- **Speech**: Gemini 2.5 Flash TTS for high-quality audio synthesis.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🧪 Reproducible Testing Instructions

To verify the multimodal capabilities of Uzima Live, please follow these test cases:

### 1. Voice Assistant Test
1. Select **English** from the language toggle at the top.
2. Tap the large **Mic** button. If prompted, allow microphone access.
3. Say clearly: *"I have been feeling very tired and have a slight fever."*
4. Wait for "Thinking..." to complete.
5. **Verify**: A response overlay appears with text advice and the audio should play automatically. Use the Play/Pause/Stop buttons to test controls.
6. Switch the language to **Swahili** and repeat with: *"Ninaumwa na kichwa sana."*

### 2. Interactive Chat Test
1. Navigate to the **Chat** tab.
2. Type: *"What are the common signs of malaria in children?"* and click Send.
3. **Verify**: The AI assistant provides a response. Check if it mentions local trends (the tool is configured to detect 'malaria').
4. Click the **Play** icon on the AI message bubble to hear the audio version.

### 3. Document Scanner (Vision) Test
1. Navigate to the **Scan** tab.
2. **PDF Upload**: Click **Upload PDF** and select a sample medical PDF or image.
3. Click **Interpret**.
4. **Verify**: The AI analyzes the document and provides a summary in the selected language.
5. **Camera Scan**: Click **Scan Now**. Position a piece of text (like a mock prescription) in the frame and click the shutter.
6. Click **Interpret** and verify the explanation.
7. Click the **X** to close the overlay. A toast should confirm that document data has been cleared from memory.

## 📁 Project Structure

- `src/ai/flows/`: Genkit Server Actions for health advice and document interpretation.
- `src/components/health/`: UI components for Voice, Chat, and Vision modes.
- `src/app/`: Next.js application routes and global styles.

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or later)
- A Google AI (Gemini) API Key

### Installation

1. Clone the repository.
2. Install dependencies: `npm install`
3. Set your environment variables in `.env`:
   ```env
   GOOGLE_GENAI_API_KEY=your_api_key_here
   ```

### Running the App

```bash
npm run dev
```

## ⚖️ Disclaimer

Uzima Live is an AI-powered assistant intended for informational purposes only. It is **not** a substitute for professional medical advice. **In case of an emergency, contact local emergency services immediately.**
