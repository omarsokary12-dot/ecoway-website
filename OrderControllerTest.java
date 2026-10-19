package com.ecoway.shop;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    // Product id 5 exists in products.json
    private static final String VALID_CUSTOMER =
            "\"name\":\"رشا\",\"email\":\"customer@example.com\",\"phone\":\"01012345678\",\"address\":\"Cairo\"";

    @Autowired
    private MockMvc mvc;

    @Test
    void validOrderReturnsWhatsAppLink() throws Exception {
        mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" + VALID_CUSTOMER + ",\"items\":[{\"productId\":5,\"quantity\":2}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.whatsappUrl").value(startsWith("https://wa.me/966532831719?text=")))
                .andExpect(jsonPath("$.currency").value("EGP"));
    }

    @Test
    void nullItemIsRejectedNotA500() throws Exception {
        mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" + VALID_CUSTOMER + ",\"items\":[null]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void tooManyItemsIsRejected() throws Exception {
        String items = IntStream.range(0, 51)
                .mapToObj(i -> "{\"productId\":5,\"quantity\":1}")
                .collect(Collectors.joining(","));
        mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" + VALID_CUSTOMER + ",\"items\":[" + items + "]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownProductIsRejected() throws Exception {
        mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" + VALID_CUSTOMER + ",\"items\":[{\"productId\":999999,\"quantity\":1}]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidEmailIsRejected() throws Exception {
        mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"رشا\",\"email\":\"not-an-email\",\"phone\":\"01012345678\","
                                + "\"address\":\"Cairo\",\"items\":[{\"productId\":5,\"quantity\":1}]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingPhoneIsRejected() throws Exception {
        mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"رشا\",\"email\":\"customer@example.com\",\"address\":\"Cairo\","
                                + "\"items\":[{\"productId\":5,\"quantity\":1}]}"))
                .andExpect(status().isBadRequest());
    }
}
