package com.market.client;

import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

    private static final Logger log = LoggerFactory.getLogger(WebClientConfig.class);

    @Bean
    public WebClient mlApiWebClient(
            @Value("${market.ml-api.url}") String mlApiUrl,
            @Value("${market.ml-api.timeout-seconds}") int timeoutSeconds) {

        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(timeoutSeconds))
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(timeoutSeconds, TimeUnit.SECONDS))
                                .addHandlerLast(new WriteTimeoutHandler(timeoutSeconds, TimeUnit.SECONDS)));

        return WebClient.builder()
                .baseUrl(mlApiUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .filter(traceIdFilter())
                .build();
    }

    private ExchangeFilterFunction traceIdFilter() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> {
            String traceId = MDC.get("traceId");
            if (traceId != null) {
                return Mono.just(ClientRequest.from(request)
                        .header("X-Request-Id", traceId)
                        .build());
            }
            return Mono.just(request);
        });
    }
}
