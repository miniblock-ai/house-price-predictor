package com.market.exception;

import com.market.dto.ApiResponse;
import com.market.validator.FilterParamsValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(FilterParamsValidator.InvalidFilterException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidFilter(FilterParamsValidator.InvalidFilterException e) {
        log.warn("Invalid filter: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400200, e.getMessage()));
    }

    @ExceptionHandler(DatasetNotLoadedException.class)
    public ResponseEntity<ApiResponse<Void>> handleDatasetNotLoaded(DatasetNotLoadedException e) {
        log.error("Dataset not loaded: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500200, "Dataset not loaded"));
    }

    @ExceptionHandler(MlApiUnavailableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMlApiUnavailable(MlApiUnavailableException e) {
        log.warn("ML API unavailable: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error(503200, "Prediction service temporarily unavailable, retry after 30s"));
    }

    @ExceptionHandler(NoDataToExportException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoDataToExport(NoDataToExportException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400202, "No data to export with current filters"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception e) {
        log.error("Unexpected error: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500200, "Internal server error"));
    }
}
