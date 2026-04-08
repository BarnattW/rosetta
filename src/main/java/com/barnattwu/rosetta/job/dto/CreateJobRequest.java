package com.barnattwu.rosetta.job.dto;

import java.util.List;

public class CreateJobRequest {
    private String sourceLanguage;
    private List<String> targetLanguages;
    private String fileName;

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }

    public List<String> getTargetLanguages() { return targetLanguages; }
    public void setTargetLanguages(List<String> targetLanguages) { this.targetLanguages = targetLanguages; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
}
