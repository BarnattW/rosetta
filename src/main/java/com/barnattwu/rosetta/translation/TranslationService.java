package com.barnattwu.rosetta.translation;

import java.util.List;

import org.springframework.stereotype.Service;

import com.barnattwu.rosetta.caption.Caption;
import com.barnattwu.rosetta.caption.CaptionRepository;
import com.barnattwu.rosetta.job.Job;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.client.OpenAIClient;
import com.openai.models.ChatModel;
import com.openai.models.chat.completions.ChatCompletionCreateParams;

@Service
public class TranslationService {

  private final OpenAIClient openAIClient;
  private final CaptionRepository captionRepository;

  public TranslationService(
    OpenAIClient openAIClient,
    CaptionRepository captionRepository
  ) {
    this.openAIClient = openAIClient;
    this.captionRepository = captionRepository;
  }

  public void translate(Job job, String transcript) {
    String prompt =
      """
                You are a caption generator. Given a transcript, split it into caption segments and translate each segment.
                Target language: %s
                
                Return ONLY a JSON array in this exact format, no other text:
                [
                  {"index": 0, "startTime": 0, "endTime": 3000, "originalText": "...", "translatedText": "..."},
                  {"index": 1, "startTime": 3000, "endTime": 6000, "originalText": "...", "translatedText": "..."}
                ]
                
                Transcript:
                %s
                """.formatted(
          job.getTargetLanguage(),
          transcript
        );

    ChatCompletionCreateParams params = ChatCompletionCreateParams
      .builder()
      .model(ChatModel.GPT_4O_MINI)
      .addUserMessage(prompt)
      .build();

    String response = openAIClient
      .chat()
      .completions()
      .create(params)
      .choices()
      .get(0)
      .message()
      .content()
      .orElseThrow();

    List<Caption> captions = parseCaptions(response, job);
    captionRepository.saveAll(captions);
  }

  private List<Caption> parseCaptions(String json, Job job) {
    String cleaned = json
      .replaceAll("```json\\s*", "")
      .replaceAll("```\\s*", "")
      .trim();

    ObjectMapper mapper = new ObjectMapper();
    try {
      List<JsonNode> nodes = mapper.readValue(
        cleaned,
        mapper
          .getTypeFactory()
          .constructCollectionType(List.class, JsonNode.class)
      );

      return nodes
        .stream()
        .map(node -> {
          Caption caption = new Caption();
          caption.setJob(job);
          caption.setIndex(node.get("index").asInt());
          caption.setStartTime(node.get("startTime").asLong());
          caption.setEndTime(node.get("endTime").asLong());
          caption.setOriginalText(node.get("originalText").asText());
          caption.setTranslatedText(node.get("translatedText").asText());
          return caption;
        })
        .toList();
    } catch (Exception e) {
      throw new RuntimeException(
        "Failed to parse captions from GPT response: " + e.getMessage(),
        e
      );
    }
  }
}
