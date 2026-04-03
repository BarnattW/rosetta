package com.barnattwu.rosetta.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {
    @Bean
    public NewTopic jobCreatedTopic() {
        return TopicBuilder.name("job-created")
            .partitions(1)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic jobTranscribedTopic() {
        return TopicBuilder.name("job-transcribed")
            .partitions(1)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic jobTranslatedTopic() {
        return TopicBuilder.name("job-translated")
            .partitions(1)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic jobCompletedTopic() {
        return TopicBuilder.name("job-completed")
            .partitions(1)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic jobFailedTopic() {
        return TopicBuilder.name("job-failed")
            .partitions(1)
            .replicas(1)
            .build();
    }
}
