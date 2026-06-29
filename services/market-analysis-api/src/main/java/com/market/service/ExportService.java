package com.market.service;

import com.market.model.FilterParams;
import com.market.model.PropertyRecord;
import com.market.repository.PropertyRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.awt.*;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

@Service
public class ExportService {

    private static final Logger log = LoggerFactory.getLogger(ExportService.class);

    private final PropertyRepository propertyRepository;
    private final StatisticsService statisticsService;

    public ExportService(PropertyRepository propertyRepository, StatisticsService statisticsService) {
        this.propertyRepository = propertyRepository;
        this.statisticsService = statisticsService;
    }

    public Mono<byte[]> generatePdfReport(FilterParams filters) {
        return Mono.fromCallable(() -> {
            List<PropertyRecord> records = propertyRepository.findFiltered(filters);
            if (records.isEmpty()) {
                throw new com.market.exception.NoDataToExportException("No data to export with current filters");
            }

            try {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                Document document = new Document(PageSize.A4);
                PdfWriter.getInstance(document, baos);
                document.open();

                // Title
                Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLUE);
                document.add(new Paragraph("Property Market Analysis Report", titleFont));
                document.add(new Paragraph("Generated: " + LocalDate.now(), FontFactory.getFont(FontFactory.HELVETICA, 10)));
                document.add(Chunk.NEWLINE);

                // Filter summary
                if (filters != null) {
                    document.add(new Paragraph("Applied Filters:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                    addFilterIfPresent(document, "Price Range",
                            filters.getMinPrice() + " - " + filters.getMaxPrice());
                    addFilterIfPresent(document, "School Rating",
                            filters.getMinSchoolRating() + " - " + filters.getMaxSchoolRating());
                    document.add(Chunk.NEWLINE);
                }

                // Statistics summary
                var stats = statisticsService.getStatistics(filters).block();
                document.add(new Paragraph("Summary Statistics:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                document.add(new Paragraph("Total Listings: " + stats.getTotalListings()));
                document.add(new Paragraph("Average Price: $" + String.format("%,.0f", stats.getAveragePrice())));
                document.add(new Paragraph("Median Price: $" + String.format("%,.0f", stats.getMedianPrice())));
                document.add(new Paragraph("Avg Price/sqft: $" + String.format("%,.2f", stats.getAveragePricePerSqft())));
                document.add(Chunk.NEWLINE);

                // Data table (first 50 rows)
                document.add(new Paragraph("Property Listings (first 50 rows):",
                        FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                PdfPTable table = new PdfPTable(7);
                table.setWidthPercentage(100);
                Stream.of("Price", "SqFt", "Beds", "Baths", "Year", "Lot Size", "School")
                        .forEach(h -> {
                            PdfPCell cell = new PdfPCell(new Phrase(h,
                                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8)));
                            cell.setBackgroundColor(Color.LIGHT_GRAY);
                            table.addCell(cell);
                        });

                records.stream().limit(50).forEach(r -> {
                    table.addCell(String.format("$%,.0f", r.getPrice()));
                    table.addCell(String.format("%,.0f", r.getSquareFootage()));
                    table.addCell(String.valueOf(r.getBedrooms()));
                    table.addCell(String.valueOf(r.getBathrooms()));
                    table.addCell(String.valueOf(r.getYearBuilt()));
                    table.addCell(String.format("%,.0f", r.getLotSize()));
                    table.addCell(String.valueOf(r.getSchoolRating()));
                });
                document.add(table);

                document.close();
                log.info("PDF report generated: {} records", Math.min(records.size(), 50));
                return baos.toByteArray();

            } catch (DocumentException e) {
                log.error("PDF generation failed: {}", e.getMessage());
                throw new RuntimeException("Failed to generate PDF", e);
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private void addFilterIfPresent(Document doc, String label, Object value) {
        if (value != null) {
            try {
                doc.add(new Paragraph("  " + label + ": " + value));
            } catch (DocumentException e) {
                // ignore
            }
        }
    }
}
