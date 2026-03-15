# Uzima Live | AI Health Assistant

Uzima Live is a real-time, multimodal AI health agent designed for the Uzima Mesh network. It provides personalized health guidance and medical document interpretation in both **English** and **Swahili**, leveraging Google's Gemini 2.5 Flash model via Genkit.

## 🚀 Key Features

- **Voice Assistant**: Tap to speak your health concerns and receive spoken advice in your preferred language.
- **Interactive Chat**: Type symptoms or questions to get medically grounded guidance with optional audio playback.
- **Document Scanner (Vision)**:
    - Live camera scanning for medical documents (prescriptions, lab reports, IDs).
    - PDF upload support for detailed interpretation.
    - Automatic text-to-speech explanations of findings.
- **Multilingual Support**: Seamless switching between English and Swahili for all AI interactions and audio responses.
- **Privacy First**: Health documents are processed securely and document data is purged from the client memory immediately after interpretation results are closed.
- **Community Grounded**: The AI uses internal tools to reference local community health trends (e.g., malaria outbreaks or nutrition initiatives) to provide context-aware advice.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **AI Orchestration**: [Genkit](https://firebase.google.com/docs/genkit)
- **LLM**: Gemini 2.5 Flash (via `@genkit-ai/google-genai`)
- **Speech**: Gemini 2.5 Flash TTS for high-quality audio synthesis.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Hooks (useState, useEffect, useRef)

## 📁 Project Structure

- `src/ai/flows/`: Contains the Genkit Server Actions for health advice and document interpretation.
- `src/components/health/`: Modular UI components for Voice, Chat, and Vision modes.
- `src/firebase/`: Configuration and providers for Firebase services.
- `src/app/`: Next.js application routes and global styles.

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or later)
- A Google AI (Gemini) API Key

### Installation

1. Clone the repository.
2. Install dependencies (handled automatically in this environment).
3. Set your environment variables in a `.env` file:
   ```env
   GOOGLE_GENAI_API_KEY=your_api_key_here
   ```

### Running the App

```bash
npm run dev
```

Visit `http://localhost:9002` to interact with the agent.

## ⚖️ Disclaimer

Uzima Live is an AI-powered assistant intended for informational and educational purposes within the Uzima Mesh network. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. **In case of an emergency, contact local emergency services immediately.**
