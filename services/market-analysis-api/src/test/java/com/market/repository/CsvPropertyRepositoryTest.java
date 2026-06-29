package com.market.repository;

import com.market.model.FilterParams;
import com.market.model.PropertyRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.*;

class CsvPropertyRepositoryTest {

    private CsvPropertyRepository repository;

    @BeforeEach
    void setUp() {
        repository = new CsvPropertyRepository();
        repository.loadDataset("test-data/sample-properties.csv");
    }

    @Test
    void shouldLoadValidRecords() {
        assertEquals(12, repository.findAll().size());
        assertTrue(repository.isLoaded());
    }

    @Test
    void shouldFindAll() {
        var all = repository.findAll();
        assertEquals(12, all.size());
    }

    @Test
    void shouldFindById() {
        PropertyRecord record = repository.findById(1L);
        assertNotNull(record);
        assertEquals(2500.0, record.getSquareFootage());
    }

    @Test
    void shouldReturnNullForMissingId() {
        assertNull(repository.findById(999L));
    }

    @Test
    void shouldFilterByMinPrice() {
        FilterParams filters = new FilterParams();
        filters.setMinPrice(400000.0);
        var result = repository.findFiltered(filters);
        assertTrue(result.stream().allMatch(r -> r.getPrice() >= 400000.0));
    }

    @Test
    void shouldFilterByMultipleCriteria() {
        FilterParams filters = new FilterParams();
        filters.setMinPrice(300000.0);
        filters.setMaxPrice(500000.0);
        filters.setYearBuiltFrom(2005);
        var result = repository.findFiltered(filters);
        assertTrue(result.stream().allMatch(r ->
                r.getPrice() >= 300000.0 && r.getPrice() <= 500000.0
                        && r.getYearBuilt() >= 2005));
    }

    @Test
    void shouldReturnEmptyForNoMatch() {
        FilterParams filters = new FilterParams();
        filters.setMinPrice(9_999_999.0);
        var result = repository.findFiltered(filters);
        assertTrue(result.isEmpty());
    }

    @Test
    void shouldReturnAllWhenFiltersNull() {
        assertEquals(12, repository.findFiltered((FilterParams) null).size());
    }

    @Test
    void shouldPageResults() {
        Pageable pageable = PageRequest.of(0, 3);
        Page<PropertyRecord> page = repository.findFiltered(null, pageable);
        assertEquals(3, page.getContent().size());
        assertEquals(12, page.getTotalElements());
        assertEquals(4, page.getTotalPages());
    }

    @Test
    void shouldSortByPriceAsc() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("price").ascending());
        Page<PropertyRecord> page = repository.findFiltered(null, pageable);
        var prices = page.getContent().stream().map(PropertyRecord::getPrice).toList();
        for (int i = 1; i < prices.size(); i++) {
            assertTrue(prices.get(i) >= prices.get(i - 1));
        }
    }

    @Test
    void shouldSortByPriceDesc() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("price").descending());
        Page<PropertyRecord> page = repository.findFiltered(null, pageable);
        var prices = page.getContent().stream().map(PropertyRecord::getPrice).toList();
        for (int i = 1; i < prices.size(); i++) {
            assertTrue(prices.get(i) <= prices.get(i - 1));
        }
    }

    @Test
    void shouldSortByMultipleFields() {
        Pageable pageable = PageRequest.of(0, 10,
                Sort.by("bedrooms").descending().and(Sort.by("price").ascending()));
        Page<PropertyRecord> page = repository.findFiltered(null, pageable);
        assertEquals(10, page.getContent().size());
    }

    @Test
    void shouldHandleRepositoryWithoutInit() {
        CsvPropertyRepository emptyRepo = new CsvPropertyRepository();
        assertFalse(emptyRepo.isLoaded());
        assertTrue(emptyRepo.findAll().isEmpty());
    }

    @Test
    void shouldFilterBySchoolRatingRange() {
        FilterParams filters = new FilterParams();
        filters.setMinSchoolRating(7.0);
        filters.setMaxSchoolRating(9.0);
        var result = repository.findFiltered(filters);
        assertTrue(result.stream().allMatch(r ->
                r.getSchoolRating() >= 7.0 && r.getSchoolRating() <= 9.0));
    }

    @Test
    void shouldFilterBySizeRange() {
        FilterParams filters = new FilterParams();
        filters.setMinSizeSqft(1500.0);
        filters.setMaxSizeSqft(2500.0);
        var result = repository.findFiltered(filters);
        assertTrue(result.stream().allMatch(r ->
                r.getSquareFootage() >= 1500.0 && r.getSquareFootage() <= 2500.0));
    }

    @Test
    void shouldFilterByYearBuiltRange() {
        FilterParams filters = new FilterParams();
        filters.setYearBuiltFrom(2010);
        filters.setYearBuiltTo(2020);
        var result = repository.findFiltered(filters);
        assertTrue(result.stream().allMatch(r ->
                r.getYearBuilt() >= 2010 && r.getYearBuilt() <= 2020));
    }

    @Test
    void loadDataset_fileNotFound_shouldLogWarning() {
        CsvPropertyRepository repo = new CsvPropertyRepository();
        repo.loadDataset("test-data/nonexistent.csv");
        assertFalse(repo.isLoaded());
        assertTrue(repo.findAll().isEmpty());
    }

    @Test
    void loadDataset_emptyFile_shouldLogWarning() {
        CsvPropertyRepository repo = new CsvPropertyRepository();
        repo.loadDataset("test-data/empty.csv");
        assertFalse(repo.isLoaded());
        assertTrue(repo.findAll().isEmpty());
    }

    @Test
    void shouldSortBySquareFootage() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("square_footage").ascending());
        Page<PropertyRecord> page = repository.findFiltered(null, pageable);
        var sqfts = page.getContent().stream().map(PropertyRecord::getSquareFootage).toList();
        for (int i = 1; i < sqfts.size(); i++) {
            assertTrue(sqfts.get(i) >= sqfts.get(i - 1));
        }
    }

    @Test
    void shouldSortByBathrooms() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("bathrooms").ascending());
        Page<PropertyRecord> page = repository.findFiltered(null, pageable);
        assertEquals(12, page.getContent().size());
    }

    @Test
    void shouldSortByYearBuilt() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("year_built").ascending());
        Page<PropertyRecord> page = repository.findFiltered(null, pageable);
        assertEquals(12, page.getContent().size());
    }

    @Test
    void shouldSortByLotSize() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("lot_size").descending());
        Page<PropertyRecord> page = repository.findFiltered(null, pageable);
        assertEquals(12, page.getContent().size());
    }

    @Test
    void shouldSortBySchoolRating() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("school_rating").ascending());
        Page<PropertyRecord> page = repository.findFiltered(null, pageable);
        assertEquals(12, page.getContent().size());
    }

    @Test
    void shouldFilterByYearBuiltTo() {
        FilterParams filters = new FilterParams();
        filters.setYearBuiltTo(2005);
        var result = repository.findFiltered(filters);
        assertTrue(result.stream().allMatch(r -> r.getYearBuilt() <= 2005));
    }
}
