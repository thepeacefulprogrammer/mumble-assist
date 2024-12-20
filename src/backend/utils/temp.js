// Import the Cloud Speech-to-Text library
const speech = require('@google-cloud/speech').v2;

// Instantiates a client
const client = new speech.SpeechClient();

// Your local audio file to transcribe
const audioFilePath = "gs://mumble-assist-bucket/audio-files/tony_robbins.mp3";
// Full recognizer resource name
const recognizer = "projects/mumble-assist/locations/eu/recognizers/_";
// The output path of the transcription result.
const workspace = "gs://mumble-assist-bucket/transcripts";

const recognitionConfig = {
  autoDecodingConfig: {},
  model: "long",
  languageCodes: ["en-CA"],
  features: {
  enableWordTimeOffsets: true,
  enable_word_confidence: true,
  },
};

const audioFiles = [
  { uri: audioFilePath }
];
const outputPath = {
  gcsOutputConfig: {
    uri: workspace
  }
};

async function transcribeSpeech() {
  const transcriptionRequest = {
    recognizer: recognizer,
    config: recognitionConfig,
    files: audioFiles,
    recognitionOutputConfig: outputPath,
  };

  await client.batchRecognize(transcriptionRequest);
}

transcribeSpeech();