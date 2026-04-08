package com.barnattwu.rosetta.translation;

import java.util.List;

import org.springframework.stereotype.Service;

import com.barnattwu.rosetta.caption.Caption;
import com.barnattwu.rosetta.caption.CaptionRepository;
import com.barnattwu.rosetta.job.Job;
import com.barnattwu.rosetta.transcription.TranscriptionService.TranscriptionSegment;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.client.OpenAIClient;
import com.openai.models.ChatModel;
import com.openai.models.chat.completions.ChatCompletionCreateParams;

@Service
public class TranslationService {

  private final OpenAIClient openAIClient;
  private final CaptionRepository captionRepository;

  public TranslationService(OpenAIClient openAIClient, CaptionRepository captionRepository) {
    this.openAIClient = openAIClient;
    this.captionRepository = captionRepository;
  }

  public void translate(Job job, String segmentsJson, String targetLanguage) {
    ObjectMapper mapper = new ObjectMapper();
    List<TranscriptionSegment> segments;

    try {
      segments = mapper.readValue(
        segmentsJson,
        mapper.getTypeFactory().constructCollectionType(List.class, TranscriptionSegment.class)
      );
    } catch (Exception e) {
      throw new RuntimeException("Failed to parse transcription segments: " + e.getMessage(), e);
    }

    String prompt = """
        You are a professional subtitle translator. Translate each segment from %s to %s.
        Preserve the natural tone and meaning. Each segment is a caption from a video — keep translations concise and natural for on-screen reading.
        Return ONLY a JSON array in this exact format, no other text:
        [
          {"index": 0, "translatedText": "..."},
          {"index": 1, "translatedText": "..."}
        ]

        Segments:
        %s
        """.formatted(
        job.getSourceLanguage(),
        targetLanguage,
        segments.stream()
          .map(s -> "[%d] (%.1fs - %.1fs): %s".formatted(
              s.index(),
              s.startTime() / 1000.0,
              s.endTime() / 1000.0,
              s.text()
          ))
          .reduce("", (a, b) -> a + "\n" + b)
    );

    ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
      .model(ChatModel.GPT_4O)
      .addUserMessage(prompt)
      .build();

    String response = openAIClient.chat().completions().create(params)
      .choices().get(0).message().content().orElseThrow();

    String cleaned = response.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

    try {
      List<JsonNode> translations = mapper.readValue(
        cleaned,
        mapper.getTypeFactory().constructCollectionType(List.class, JsonNode.class)
      );

      List<Caption> captions = segments.stream().map(seg -> {
        String translatedText = translations.stream()
          .filter(t -> t.get("index").asInt() == seg.index())
          .findFirst()
          .map(t -> t.get("translatedText").asText())
          .orElse(seg.text());

        Caption caption = new Caption();
        caption.setJob(job);
        caption.setIndex(seg.index());
        caption.setStartTime(seg.startTime());
        caption.setEndTime(seg.endTime());
        caption.setOriginalText(seg.text());
        caption.setTranslatedText(translatedText);
        caption.setLanguage(targetLanguage);
        return caption;
      }).toList();

      // Delete any partial captions from a previous interrupted attempt before inserting
      captionRepository.deleteByJobIdAndLanguage(job.getId(), targetLanguage);
      captionRepository.saveAll(captions);
    } catch (Exception e) {
      throw new RuntimeException("Failed to parse translation response: " + e.getMessage(), e);
    }
  }
}
