package com.market;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import reactor.core.publisher.Hooks;

@SpringBootApplication
public class MarketAnalysisApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarketAnalysisApplication.class, args);
    }

    @PostConstruct
    void enableReactorContextPropagation() {
        Hooks.enableAutomaticContextPropagation();
    }
}
