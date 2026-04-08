package com.barnattwu.rosetta.transcription;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.client.OpenAIClient;
import com.openai.models.audio.AudioResponseFormat;
import com.openai.models.audio.transcriptions.TranscriptionCreateParams;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;

@Service
public class TranscriptionService {
    private static final Logger log = LoggerFactory.getLogger(TranscriptionService.class);

    private final OpenAIClient openAIClient;
    private final S3Client s3Client;

    public TranscriptionService(OpenAIClient openAIClient, S3Client s3Client) {
        this.openAIClient = openAIClient;
        this.s3Client = s3Client;
    }

    public String transcribe(String storageKey, String bucket) {
        Path videoFile = null;
        Path audioFile = null;
        try {
            long fileSize = s3Client.headObject(HeadObjectRequest.builder()
                .bucket(bucket).key(storageKey).build()).contentLength();
            log.info("Transcribing storageKey={} size={}MB", storageKey,
                String.format("%.1f", fileSize / 1024.0 / 1024.0));

            // Download video
            videoFile = Files.createTempFile("rosetta-video-", ".mp4");
            try (InputStream in = s3Client.getObject(GetObjectRequest.builder()
                    .bucket(bucket).key(storageKey).build())) {
                Files.copy(in, videoFile, StandardCopyOption.REPLACE_EXISTING);
            }
            log.debug("Downloaded video to {}", videoFile);

            // Extract audio with ffmpeg: mono 16kHz MP3 at 32kbps (~14MB/hr, well under Whisper's 25MB limit)
            audioFile = Files.createTempFile("rosetta-audio-", ".mp3");
            extractAudio(videoFile, audioFile);

            long audioSize = Files.size(audioFile);
            log.info("Extracted audio size={}MB, sending to Whisper", String.format("%.1f", audioSize / 1024.0 / 1024.0));

            TranscriptionCreateParams params = TranscriptionCreateParams.builder()
                .model("whisper-1")
                .file(audioFile)
                .responseFormat(AudioResponseFormat.VERBOSE_JSON)
                .build();

            var verbose = openAIClient.audio().transcriptions().create(params).asVerbose();
            var segments = verbose.segments().orElseThrow(() -> new RuntimeException("No segments returned from Whisper"));
            log.info("Whisper returned {} segments", segments.size());

            List<TranscriptionSegment> result = new ArrayList<>();
            for (int i = 0; i < segments.size(); i++) {
                var seg = segments.get(i);
                result.add(new TranscriptionSegment(
                    i,
                    (long)(seg.start() * 1000),
                    (long)(seg.end() * 1000),
                    seg.text().trim()
                ));
            }

            return new ObjectMapper().writeValueAsString(result);
        } catch (Exception e) {
            log.error("Transcription failed for storageKey={}: {}", storageKey, e.getMessage(), e);
            throw new RuntimeException("Failed to transcribe audio: " + e.getMessage(), e);
        } finally {
            tryDelete(videoFile);
            tryDelete(audioFile);
        }
    }

    private void extractAudio(Path videoFile, Path audioFile) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
            "ffmpeg", "-y",
            "-i", videoFile.toString(),
            "-vn",           // drop video stream
            "-ar", "16000",  // 16kHz sample rate (Whisper's native rate)
            "-ac", "1",      // mono
            "-b:a", "32k",   // 32kbps — ~14MB/hr, plenty for speech recognition
            audioFile.toString()
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();

        String output = new String(process.getInputStream().readAllBytes());
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            log.error("ffmpeg exited with code {}: {}", exitCode, output);
            throw new RuntimeException("Audio extraction failed (ffmpeg exit code " + exitCode + ")");
        }
        log.debug("ffmpeg output: {}", output);
    }

    private void tryDelete(Path path) {
        if (path != null) {
            try { Files.deleteIfExists(path); } catch (Exception ignored) {}
        }
    }

    public record TranscriptionSegment(int index, long startTime, long endTime, String text) {}
}
