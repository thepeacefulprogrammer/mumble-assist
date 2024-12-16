import fs from 'fs';
import path from 'path';
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
     * @returns {Promise<Object>} - Object containing sentenceData and transcription.
     */
    async splitAudioIntoSentences(inputFilePath, outputDir) {
        // Step 1: Transcribe the audio and get timestamps
        const transcription = await this.transcribeAudio(inputFilePath);
        const sentences = this.extractSentences(transcription);

        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Step 2: Split the audio based on sentence timestamps and build sentence data
        const sentenceData = await Promise.all(
            sentences.map(async (sentence, index) => {
                const start = sentence.startTime;
                const duration = sentence.endTime - sentence.startTime;
                const outputFileName = `sentence_${index + 1}.mp3`;
                const outputFilePath = path.join(outputDir, outputFileName);
                await this.extractAudioSegment(inputFilePath, outputFilePath, start, duration);
                // Add the audio file name to the sentence data
                return { 
                    ...sentence, 
                    fileName: outputFileName
                };
            })
        );

        return { sentenceData, transcription };
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
            config: {
                encoding: 'MP3',
                languageCode: 'en-US',
                enableWordTimeOffsets: true,
                enableAutomaticPunctuation: true,
                model: 'video',
                useEnhanced: true,
            },
            audio: {
                content: audioBytes,
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
        const words = [];

        // Collect all words with timings
        if (transcription && transcription.results) {
            transcription.results.forEach((result, index) => {
                if (result.alternatives && result.alternatives.length > 0) {
                    console.log("transcript: ", result.alternatives[0].transcript);
                    const wordsInfo = result.alternatives[0].words;
                    if (wordsInfo) {
                        words.push(...wordsInfo);
                    }
                }
            });
        }

        // Build the full transcript text from the words array
        const fullTranscript = words.map(wordInfo => wordInfo.word).join(' ');

        // Split the full transcript into sentences
        const sentencesText = fullTranscript.match(/[^.!?]+[.!?]*/g);

        let wordIndex = 0;

        // For each sentence, collect words and timings
        sentencesText.forEach(sentenceText => {
            sentenceText = sentenceText.trim();
            const sentenceWords = sentenceText.split(/\s+/);
            const numWords = sentenceWords.length;

            // Get start and end times from words array
            if (wordIndex < words.length) {
                const startTime = this.convertTimeOffset(words[wordIndex].startTime);
                const endWordIndex = wordIndex + numWords - 1;
                const endTime = (endWordIndex < words.length) ?
                    this.convertTimeOffset(words[endWordIndex].endTime) :
                    this.convertTimeOffset(words[words.length - 1].endTime);

                sentences.push({
                    text: sentenceText,
                    startTime: startTime,
                    endTime: endTime
                });
                wordIndex += numWords;
            }
        });

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
                    console.error(`Error extracting segment: ${err.message}`);
                    reject(err);
                })
                .run();
        });
    }
}

export default AudioAnalyzer;