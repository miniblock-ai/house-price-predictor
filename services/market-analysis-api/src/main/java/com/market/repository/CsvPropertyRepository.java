package com.market.repository;

import com.market.model.FilterParams;
import com.market.model.PropertyRecord;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Repository
public class CsvPropertyRepository implements PropertyRepository {

    private static final Logger log = LoggerFactory.getLogger(CsvPropertyRepository.class);

    private final List<PropertyRecord> records = new ArrayList<>();
    private boolean loaded = false;

    @Value("${market.dataset.path}")
    private String datasetPath;

    @PostConstruct
    public void init() {
        loadDataset(null);
    }

    @Override
    public void loadDataset(String csvPath) {
        String path = (csvPath != null) ? csvPath : datasetPath;
        log.info("Loading dataset from: {}", path);

        try (InputStream is = getClass().getClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                log.error("Dataset not found at: {}", path);
                return;
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
                String header = reader.readLine(); // skip header
                if (header == null) {
                    log.warn("Dataset file is empty");
                    return;
                }
                String line;
                while ((line = reader.readLine()) != null) {
                    PropertyRecord record = parseLine(line);
                    if (record != null) {
                        records.add(record);
                    }
                }
            }
            loaded = true;
            log.info("Dataset loaded: {} records", records.size());
        } catch (IOException e) {
            log.error("Failed to load dataset: {}", e.getMessage());
        }
    }

    private PropertyRecord parseLine(String line) {
        String[] parts = line.split(",");
        if (parts.length < 9) {
            return null;
        }
        try {
            PropertyRecord record = new PropertyRecord();
            record.setId(Long.parseLong(parts[0].trim()));
            record.setSquareFootage(Double.parseDouble(parts[1].trim()));
            record.setBedrooms(Integer.parseInt(parts[2].trim()));
            record.setBathrooms(Double.parseDouble(parts[3].trim()));
            record.setYearBuilt(Integer.parseInt(parts[4].trim()));
            record.setLotSize(Double.parseDouble(parts[5].trim()));
            record.setDistanceToCityCenter(Double.parseDouble(parts[6].trim()));
            record.setSchoolRating(Double.parseDouble(parts[7].trim()));
            record.setPrice(Double.parseDouble(parts[8].trim()));
            return record;
        } catch (NumberFormatException e) {
            log.warn("Skipping malformed line: {}", line);
            return null;
        }
    }

    @Override
    public List<PropertyRecord> findAll() {
        return new ArrayList<>(records);
    }

    @Override
    public PropertyRecord findById(long id) {
        return records.stream()
                .filter(r -> r.getId() == id)
                .findFirst()
                .orElse(null);
    }

    @Override
    public Page<PropertyRecord> findFiltered(FilterParams filters, Pageable pageable) {
        List<PropertyRecord> filtered = applyFilters(filters)
                .collect(Collectors.toList());

        // Apply sorting
        Stream<PropertyRecord> sorted = applySorting(filtered.stream(), pageable);

        List<PropertyRecord> content = sorted
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, filtered.size());
    }

    @Override
    public List<PropertyRecord> findFiltered(FilterParams filters) {
        return applyFilters(filters).collect(Collectors.toList());
    }

    @Override
    public boolean isLoaded() {
        return loaded;
    }

    private Stream<PropertyRecord> applyFilters(FilterParams filters) {
        if (filters == null) {
            return records.stream();
        }
        Stream<PropertyRecord> stream = records.stream();

        if (filters.getMinPrice() != null) {
            stream = stream.filter(r -> r.getPrice() >= filters.getMinPrice());
        }
        if (filters.getMaxPrice() != null) {
            stream = stream.filter(r -> r.getPrice() <= filters.getMaxPrice());
        }
        if (filters.getMinSchoolRating() != null) {
            stream = stream.filter(r -> r.getSchoolRating() >= filters.getMinSchoolRating());
        }
        if (filters.getMaxSchoolRating() != null) {
            stream = stream.filter(r -> r.getSchoolRating() <= filters.getMaxSchoolRating());
        }
        if (filters.getYearBuiltFrom() != null) {
            stream = stream.filter(r -> r.getYearBuilt() >= filters.getYearBuiltFrom());
        }
        if (filters.getYearBuiltTo() != null) {
            stream = stream.filter(r -> r.getYearBuilt() <= filters.getYearBuiltTo());
        }
        if (filters.getMinSizeSqft() != null) {
            stream = stream.filter(r -> r.getSquareFootage() >= filters.getMinSizeSqft());
        }
        if (filters.getMaxSizeSqft() != null) {
            stream = stream.filter(r -> r.getSquareFootage() <= filters.getMaxSizeSqft());
        }

        return stream;
    }

    private Stream<PropertyRecord> applySorting(Stream<PropertyRecord> stream, Pageable pageable) {
        if (!pageable.getSort().isUnsorted()) {
            Comparator<PropertyRecord> comparator = null;
            for (var order : pageable.getSort()) {
                Comparator<PropertyRecord> propertyComparator = switch (order.getProperty()) {
                    case "price" -> Comparator.comparing(PropertyRecord::getPrice);
                    case "square_footage" -> Comparator.comparing(PropertyRecord::getSquareFootage);
                    case "bedrooms" -> Comparator.comparing(PropertyRecord::getBedrooms);
                    case "bathrooms" -> Comparator.comparing(PropertyRecord::getBathrooms);
                    case "year_built" -> Comparator.comparing(PropertyRecord::getYearBuilt);
                    case "lot_size" -> Comparator.comparing(PropertyRecord::getLotSize);
                    case "school_rating" -> Comparator.comparing(PropertyRecord::getSchoolRating);
                    default -> null;
                };
                if (propertyComparator != null) {
                    if (order.isDescending()) {
                        propertyComparator = propertyComparator.reversed();
                    }
                    comparator = (comparator == null) ? propertyComparator : comparator.thenComparing(propertyComparator);
                }
            }
            if (comparator != null) {
                stream = stream.sorted(comparator);
            }
        }
        return stream;
    }
}
