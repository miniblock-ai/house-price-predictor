package com.market.service;

import com.market.dto.PageDto;
import com.market.dto.PropertyListingDto;
import com.market.model.FilterParams;
import com.market.model.PropertyRecord;
import com.market.repository.PropertyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingsServiceTest {

    @Mock
    private PropertyRepository propertyRepository;

    private ListingsService listingsService;

    @BeforeEach
    void setUp() {
        listingsService = new ListingsService(propertyRepository);
    }

    @Test
    void getListings_shouldReturnPagedResults() {
        FilterParams params = null;
        List<PropertyRecord> records = List.of(
                createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 450000),
                createRecord(2, 1500, 2, 1, 2000, 6000, 3.0, 7.0, 300000)
        );
        Page<PropertyRecord> page = new PageImpl<>(records, PageRequest.of(0, 20, Sort.by("price")), 2);
        when(propertyRepository.findFiltered(any(), any())).thenReturn(page);

        PageDto<PropertyListingDto> result = listingsService.getListings(params, 0, 20, "price,asc").block();
        assertNotNull(result);

        assertEquals(2, result.getTotalElements());
        assertEquals(2, result.getContent().size());
        assertEquals(0, result.getPage());
        assertEquals(20, result.getSize());
    }

    @Test
    void getListings_shouldApplySortDirection() {
        List<PropertyRecord> records = List.of(
                createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 300000),
                createRecord(2, 1500, 2, 1, 2000, 6000, 3.0, 7.0, 450000)
        );
        Page<PropertyRecord> page = new PageImpl<>(records, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "price")), 2);
        when(propertyRepository.findFiltered(any(), any())).thenReturn(page);

        PageDto<PropertyListingDto> result = listingsService.getListings(null, 0, 20, "price,desc").block();
        assertNotNull(result);

        assertEquals(2, result.getContent().size());
    }

    private PropertyRecord createRecord(long id, double sqft, int beds, double baths,
                                        int year, double lotSize, double distance,
                                        double schoolRating, double price) {
        return new PropertyRecord(id, sqft, beds, baths, year, lotSize, distance, schoolRating, price);
    }
}
