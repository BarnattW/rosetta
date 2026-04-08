package com.barnattwu.rosetta.translation;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.barnattwu.rosetta.caption.Caption;
import com.barnattwu.rosetta.caption.CaptionRepository;
import com.barnattwu.rosetta.job.Job;
import com.barnattwu.rosetta.transcription.TranscriptionService.TranscriptionSegment;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.client.OpenAIClient;
import com.openai.models.ChatModel;
import com.openai.models.chat.completions.ChatCompletionCreateParams;

@Service
public class TranslationService {

  private static final Logger log = LoggerFactory.getLogger(TranslationService.class);
  private static final int CHUNK_SIZE = 50;
  private static final ObjectMapper MAPPER = new ObjectMapper()
      .configure(JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true);

  private final OpenAIClient openAIClient;
  private final CaptionRepository captionRepository;

  public TranslationService(OpenAIClient openAIClient, CaptionRepository captionRepository) {
    this.openAIClient = openAIClient;
    this.captionRepository = captionRepository;
  }

  // Structured response types — the SDK enforces these at the API level,
  // eliminating all JSON parsing variability.
  public static class TranslationItem {
    public int index;
    public String translatedText;
  }

  public static class TranslationResponse {
    public List<TranslationItem> translations;
  }

  public void translate(Job job, String segmentsJson, String targetLanguage) {
    List<TranscriptionSegment> segments;
    try {
      segments = MAPPER.readValue(
        segmentsJson,
        MAPPER.getTypeFactory().constructCollectionType(List.class, TranscriptionSegment.class)
      );
    } catch (Exception e) {
      throw new RuntimeException("Failed to parse transcription segments: " + e.getMessage(), e);
    }

    log.info("[translation] translating {} segments -> {} in chunks of {}", segments.size(), targetLanguage, CHUNK_SIZE);

    List<Caption> allCaptions = new ArrayList<>();
    int totalChunks = (int) Math.ceil((double) segments.size() / CHUNK_SIZE);
    for (int i = 0; i < segments.size(); i += CHUNK_SIZE) {
      List<TranscriptionSegment> chunk = segments.subList(i, Math.min(i + CHUNK_SIZE, segments.size()));
      log.info("[translation] chunk {}/{} ({} segments)", (i / CHUNK_SIZE) + 1, totalChunks, chunk.size());
      allCaptions.addAll(translateChunk(job, chunk, targetLanguage));
    }

    captionRepository.deleteByJobIdAndLanguage(job.getId(), targetLanguage);
    captionRepository.saveAll(allCaptions);
  }

  private List<Caption> translateChunk(Job job, List<TranscriptionSegment> chunk, String targetLanguage) {
    String segmentList = java.util.stream.IntStream.range(0, chunk.size())
        .mapToObj(i -> "[%d] (%.1fs-%.1fs): %s".formatted(
            i,
            chunk.get(i).startTime() / 1000.0,
            chunk.get(i).endTime() / 1000.0,
            chunk.get(i).text()
        ))
        .collect(java.util.stream.Collectors.joining("\n"));

    String prompt = """
        You are a professional subtitle translator. Translate each segment from %s to %s.
        Keep translations concise and natural for on-screen reading.
        You must return a translation for every segment. The response must contain exactly %d items.

        Segments:
        %s
        """.formatted(job.getSourceLanguage(), targetLanguage, chunk.size(), segmentList);

    var params = ChatCompletionCreateParams.builder()
        .model(ChatModel.GPT_4O)
        .responseFormat(TranslationResponse.class)
        .addUserMessage(prompt)
        .build();

    TranslationResponse result = openAIClient.chat().completions().create(params)
        .choices().get(0).message().content().orElseThrow(() ->
            new RuntimeException("Structured output returned empty content"));

    if (result.translations == null || result.translations.isEmpty()) {
      throw new RuntimeException("GPT returned no translations for chunk of " + chunk.size() + " segments");
    }

    log.info("[translation] received {} translations for chunk of {}", result.translations.size(), chunk.size());

    List<Caption> captions = new ArrayList<>();
    for (int i = 0; i < chunk.size(); i++) {
      TranscriptionSegment seg = chunk.get(i);
      String translatedText = (i < result.translations.size() && result.translations.get(i).translatedText != null)
          ? result.translations.get(i).translatedText
          : seg.text();

      if (translatedText.equals(seg.text())) {
        log.warn("[translation] segment {} fell back to original text (chunk position {})", seg.index(), i);
      }

      Caption caption = new Caption();
      caption.setJob(job);
      caption.setIndex(seg.index());
      caption.setStartTime(seg.startTime());
      caption.setEndTime(seg.endTime());
      caption.setOriginalText(seg.text());
      caption.setTranslatedText(translatedText);
      caption.setLanguage(targetLanguage);
      captions.add(caption);
    }
    return captions;
  }
}
