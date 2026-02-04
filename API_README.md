# Postman API Documentation: Products

Base URL: `http://localhost:5000` (or your deployed URL)

## Authentication
Most of these routes are **Protected (Admin Only)**.
1.  **Login** first via `POST /auth/login` to get your `token`.
2.  In Postman, for the requests below, go to the **Authorization** tab.
3.  Select **Type**: `Bearer Token`.
4.  Paste your token there.

---

## 1. Create Product (with Images)
*   **Method**: `POST`
*   **endpoint**: `/api/products`
*   **Body Type**: `form-data` (Crucial for image upload)

### Form Fields (Key-Value Pairs)
| Key | Type | Value (Example) |
| :--- | :--- | :--- |
| `title` | Text | Authentic Rudraksha Mala |
| `price` | Text | 1499 |
| `category` | Text | MALAS |
| `subcategory` | Text | RUDRAKSHA |
| `description` | Text | A sacred 5-mukhi rudraksha mala for meditation. |
| `stock` | Text | 100 |
| `images` | **File** | *(Select an image file from your computer)* |
| `images` | **File** | *(Select another image file...)* |

> **Note**: To send multiple images, add the `images` key multiple times, one for each file.

---

## 2. Create Product (JSON - No Images)
If you want to test quickly without images, you can use a raw JSON body.

*   **Method**: `POST`
*   **Endpoint**: `/api/products`
*   **Body Type**: `raw` -> `JSON`

```json
{
  "title": "Test Product JSON",
  "price": 500,
  "category": "TEST_CATEGORY",
  "subcategory": "TEST_SUB",
  "description": "This is a product created via raw JSON for testing.",
  "stock": 10
}
```

---

## 3. Get All Products
*   **Method**: `GET`
*   **Endpoint**: `/api/products`
*   **Query Params (Optional)**:
    *   `?keyword=rudraksha` (Search by name)
    *   `?category=MALAS` (Filter by category)

---

## 4. Get Single Product
*   **Method**: `GET`
*   **Endpoint**: `/api/products/:id`
*   **Example**: `/api/products/65c1234567890abcdef12345`

---

## 5. Update Product
*   **Method**: `PUT`
*   **Endpoint**: `/api/products/:id`
*   **Body Type**: `form-data` (if updating images) OR `raw (`application/json`)` (if just updating text).

---

## 6. Delete Product
*   **Method**: `DELETE`
*   **Endpoint**: `/api/products/:id`
