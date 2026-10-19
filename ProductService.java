package com.ecoway.shop;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ObjectMapper objectMapper;
    private List<Product> products = List.of();
    private Map<Integer, Product> byId = Map.of();

    public ProductService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void load() throws Exception {
        try (InputStream in = new ClassPathResource("products.json").getInputStream()) {
            products = objectMapper.readValue(in, new TypeReference<List<Product>>() {});
        }
        byId = products.stream().collect(Collectors.toMap(Product::id, Function.identity()));
    }

    public List<Product> findAll() {
        return products;
    }

    public Optional<Product> findById(int id) {
        return Optional.ofNullable(byId.get(id));
    }
}
