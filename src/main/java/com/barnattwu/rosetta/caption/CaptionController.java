package com.barnattwu.rosetta.caption;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jobs/{jobId}/captions")
public class CaptionController {

  private final CaptionService captionService;

  public CaptionController(CaptionService captionService) {
    this.captionService = captionService;
  }

  @GetMapping
  public ResponseEntity<List<Caption>> getCaptions(
    @PathVariable UUID jobId,
    Authentication auth
  ) {
    UUID userId = (UUID) auth.getPrincipal();
    return ResponseEntity.ok(captionService.getCaptions(jobId, userId));
  }

  @PatchMapping("/{captionId}")
  public ResponseEntity<Caption> updateCaption(
    @PathVariable UUID jobId,
    @PathVariable UUID captionId,
    @RequestBody UpdateCaptionRequest request,
    Authentication auth
  ) {
    UUID userId = (UUID) auth.getPrincipal();
    return ResponseEntity.ok(
      captionService.updateCaption(jobId, captionId, userId, request.editedText())
    );
  }

  @GetMapping("/export/srt")
  public ResponseEntity<String> exportSrt(@PathVariable UUID jobId, Authentication auth) {
    UUID userId = (UUID) auth.getPrincipal();
    String srt = captionService.exportSrt(jobId, userId);
    return ResponseEntity
      .ok()
      .header(
        HttpHeaders.CONTENT_DISPOSITION,
        "attachment; filename=\"captions.srt\""
      )
      .header(HttpHeaders.CONTENT_TYPE, "text/plain; charset=UTF-8")
      .body(srt);
  }

  record UpdateCaptionRequest(String editedText) {}
}
