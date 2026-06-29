package com.market.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class TraceIdWebFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(TraceIdWebFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String header = exchange.getRequest().getHeaders()
                .getFirst("X-Request-Id");
        String traceId = (header != null && !header.isBlank()) ? header
                : UUID.randomUUID().toString().substring(0, 8);

        return chain.filter(exchange)
                .contextWrite(ctx -> {
                    MDC.put("traceId", traceId);
                    return ctx;
                })
                .doFinally(signalType -> MDC.remove("traceId"));
    }
}
