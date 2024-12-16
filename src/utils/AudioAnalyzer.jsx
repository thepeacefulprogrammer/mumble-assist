import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import speech from '@google-cloud/speech';

class AudioAnalyzer {
    constructor() {
        this.client = new speech.SpeechClient();
    }

    /**
     * Splits the input audio file into separate audio files based on sentence boundaries.
     * @param {string} inputFilePath - Path to the input audio file.
     * @param {string} outputDir - Directory where the sentence audio files will be saved.
     * @returns {Promise<string[]>} - Array of paths to the sentence audio files.
     */
    async splitAudioIntoSentences(inputFilePath, outputDir) {
        // Step 1: Transcribe the audio and get timestamps
        const transcription = await this.transcribeAudio(inputFilePath);
        const sentences = this.extractSentences(transcription);

        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Step 2: Split the audio based on sentence timestamps
        const sentenceFiles = await Promise.all(
            sentences.map((sentence, index) => {
                const start = sentence.startTime;
                const duration = sentence.endTime - sentence.startTime;
                const outputFilePath = path.join(outputDir, `sentence_${index + 1}.mp3`);
                return this.extractAudioSegment(inputFilePath, outputFilePath, start, duration)
                    .then(() => outputFilePath);
            })
        );

        return sentenceFiles;
    }

    /**
     * Transcribes the audio file and retrieves sentence-level timestamps.
     * @param {string} filePath - Path to the audio file.
     * @returns {Promise<Object>} - Transcription result with timestamps.
     */
    async transcribeAudio(filePath) {
        const file = fs.readFileSync(filePath);
        const audioBytes = file.toString('base64');

        const request = {
            audio: {
                content: audioBytes,
            },
            config: {
                encoding: 'MP3',
                languageCode: 'en-US',
                enableWordTimeOffsets: true,
                enableAutomaticPunctuation: true,
            },
        };

        const [response] = await this.client.recognize(request);
        return response;
    }

    /**
     * Extracts sentences with their start and end times from the transcription.
     * @param {Object} transcription - Transcription result from Google Cloud.
     * @returns {Array} - Array of sentences with timing information.
     */
    extractSentences(transcription) {
        const sentences = [];
        let currentSentence = { text: '', startTime: 0, endTime: 0 };

        transcription.results.forEach(result => {
            result.alternatives[0].words.forEach(wordInfo => {
                const word = wordInfo.word;
                const startSecs = this.convertTimeOffset(wordInfo.startTime);
                const endSecs = this.convertTimeOffset(wordInfo.endTime);

                currentSentence.text += word + ' ';
                currentSentence.endTime = endSecs;

                if (wordInfo.punctuated && /[.!?]/.test(wordInfo.punctuated)) {
                    sentences.push({ ...currentSentence });
                    currentSentence = { text: '', startTime: endSecs, endTime: endSecs };
                }
            });
        });

        // Push the last sentence if it exists
        if (currentSentence.text.trim().length > 0) {
            sentences.push({ ...currentSentence });
        }

        return sentences;
    }

    /**
     * Converts a Google Cloud TimeOffset object to seconds.
     * @param {Object} timeOffset - TimeOffset object with seconds and nanos.
     * @returns {number} - Time in seconds.
     */
    convertTimeOffset(timeOffset) {
        return parseFloat(timeOffset.seconds) + parseFloat(timeOffset.nanos) / 1e9;
    }

    /**
     * Extracts a segment of the audio file based on start time and duration.
     * @param {string} inputPath - Path to the input audio file.
     * @param {string} outputPath - Path where the segment will be saved.
     * @param {number} start - Start time in seconds.
     * @param {number} duration - Duration in seconds.
     * @returns {Promise<void>}
     */
    extractAudioSegment(inputPath, outputPath, start, duration) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(start)
                .setDuration(duration)
                .output(outputPath)
                .on('end', () => {
                    console.log(`Extracted segment: ${outputPath}`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error extracting audio segment:', err);
                    reject(err);
                })
                .run();
        });
    }
}

export default AudioAnalyzer;