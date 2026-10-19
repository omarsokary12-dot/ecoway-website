package com.ecoway.shop;

import java.math.BigDecimal;

/** A product as stored in products.json. oldPrice is set only for items on sale. */
public record Product(
        int id,
        String name,
        BigDecimal price,
        BigDecimal oldPrice,
        String image,
        String currency,
        String category
) {}
