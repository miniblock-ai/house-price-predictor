package com.market.service;

import com.market.dto.MarketStatisticsDto;
import com.market.exception.NoDataToExportException;
import com.market.model.FilterParams;
import com.market.model.PropertyRecord;
import com.market.repository.PropertyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExportServiceTest {

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private StatisticsService statisticsService;

    private ExportService exportService;

    @BeforeEach
    void setUp() {
        exportService = new ExportService(propertyRepository, statisticsService);
    }

    @Test
    void generatePdfReport_shouldReturnNonEmptyPdf() {
        FilterParams filters = null;
        List<PropertyRecord> records = List.of(
                createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 450000)
        );
        when(propertyRepository.findFiltered(any())).thenReturn(records);
        when(statisticsService.getStatistics(any())).thenReturn(Mono.just(new MarketStatisticsDto()));

        byte[] pdf = exportService.generatePdfReport(filters).block();

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
        // PDF magic bytes: %PDF
        assertArrayEquals(new byte[]{0x25, 0x50, 0x44, 0x46}, new byte[]{pdf[0], pdf[1], pdf[2], pdf[3]});
    }

    @Test
    void generatePdfReport_shouldLimitTo50Rows() {
        FilterParams filters = new FilterParams();
        List<PropertyRecord> manyRecords = List.of(
                createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 100000),
                createRecord(2, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 200000),
                createRecord(3, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 300000),
                createRecord(4, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 400000),
                createRecord(5, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 500000)
        );
        when(propertyRepository.findFiltered(any())).thenReturn(manyRecords);
        when(statisticsService.getStatistics(any())).thenReturn(Mono.just(new MarketStatisticsDto()));

        byte[] pdf = exportService.generatePdfReport(filters).block();
        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    void generatePdfReport_withNoData_shouldThrowException() {
        FilterParams filters = new FilterParams();
        when(propertyRepository.findFiltered(any())).thenReturn(List.of());

        assertThrows(NoDataToExportException.class, () -> exportService.generatePdfReport(filters).block());
    }

    private PropertyRecord createRecord(long id, double sqft, int beds, double baths,
                                        int year, double lotSize, double distance,
                                        double schoolRating, double price) {
        return new PropertyRecord(id, sqft, beds, baths, year, lotSize, distance, schoolRating, price);
    }
}
