package com.barnattwu.rosetta.transcription;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import org.springframework.stereotype.Service;

import com.openai.client.OpenAIClient;
import com.openai.models.audio.transcriptions.TranscriptionCreateParams;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

@Service
public class TranscriptionService {
    private final OpenAIClient openAIClient;
    private final S3Client s3Client;

    public TranscriptionService(OpenAIClient openAIClient, S3Client s3Client) {
        this.openAIClient = openAIClient;
        this.s3Client = s3Client;
    }

    public String transcribe(String storageKey, String bucket) {
        try {
            Path tempFile = Files.createTempFile("rosetta-", ".mp4");

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(storageKey)
                .build();
            
            try (InputStream inputStream = s3Client.getObject(getObjectRequest)) {
                Files.copy(inputStream, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }

            TranscriptionCreateParams params = TranscriptionCreateParams.builder()
                .model("whisper-1")
                .file(tempFile)
                .build();
            
            String transcript = openAIClient.audio().transcriptions().create(params).asTranscription().text();

            Files.deleteIfExists(tempFile);
            return transcript;
        } catch (Exception e) {
            throw new RuntimeException("Failed to transcribe audio: " + e.getMessage(), e);
        }
    }
}
