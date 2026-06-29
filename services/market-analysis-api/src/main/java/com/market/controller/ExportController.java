package com.market.controller;

import com.market.dto.ApiResponse;
import com.market.exception.NoDataToExportException;
import com.market.model.FilterParams;
import com.market.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/market")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping("/export")
    public Mono<ResponseEntity> exportPdf(
            @RequestBody(required = false) FilterParams filters) {

        String filename = "market-report-" + LocalDate.now() + ".pdf";
        return exportService.generatePdfReport(filters)
                .map(pdfBytes -> (ResponseEntity) ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(pdfBytes))
                .onErrorResume(NoDataToExportException.class, e ->
                        Mono.just((ResponseEntity) ResponseEntity.badRequest()
                                .body(ApiResponse.error(400202, e.getMessage()))));
    }
}
