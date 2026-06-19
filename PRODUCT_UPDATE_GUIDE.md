# Product Update Functionality Guide

## Overview
Complete product update functionality has been implemented in the Product Management component, allowing admins to edit existing products alongside creating new ones.

## Features Added

### 1. **Edit Mode Toggle**
- Form dynamically switches between "Add New Product" and "Edit Product" modes
- Visual indicator shows which mode is active
- Cancel button appears in edit mode to return to create mode

### 2. **Load Product for Edit**
- Click "Edit" button in the product table to load product data
- Form auto-populates with all product fields
- Page scrolls to top automatically for user convenience
- Preserves existing images and size/quantity data

### 3. **Update Product Function**
- Validates all required fields before updating
- Supports partial updates (can update images or other fields independently)
- Handles FormData for file uploads
- Preserves existing images if no new ones are uploaded
- Shows appropriate loading state during update

### 4. **Clear Form Function**
- Resets all form fields to initial state
- Clears editing mode
- Allows user to return to create new product mode

### 5. **Edit Button in Product Table**
- New amber-colored "Edit" button in Actions column
- Positioned between "View" and "Delete" buttons
- Three actions now available: View, Edit, Delete

---

## Implementation Details

### State Management

```javascript
const [editingProductId, setEditingProductId] = useState(null)  // Track editing product ID
```

### Functions Added

#### `updateProduct(productData)`
Updates an existing product with validation and error handling.

**Parameters:**
- `productData` - Object containing product fields to update

**Validation:**
- Product Name (required)
- Price (required, must be > 0)
- Category (required)

**FormData Handling:**
- Includes all text fields
- Only uploads new image files (if user selected new ones)
- Skips existing image URLs during update
- Maintains size/quantity pairs

#### `loadProductForEdit(productId)`
Fetches product data and populates form for editing.

**Parameters:**
- `productId` - Product ID to load for editing

**Actions:**
- Fetches product from backend
- Populates all form fields with product data
- Sets editingProductId state
- Scrolls to top of page

#### `clearForm()`
Resets form to initial state and exits edit mode.

**Actions:**
- Clears all form fields
- Resets editingProductId to null
- Returns form to "Create" mode

---

## User Flow

### Creating New Product
1. Scroll to "Add New Product" form (default mode)
2. Fill in product details
3. Click "Create Product" button
4. Success message appears
5. Form clears and product is added to list

### Editing Existing Product
1. Find product in the table
2. Click "Edit" button in Actions column
3. Page scrolls to top
4. Form populates with product data
5. Update desired fields
6. Click "Update Product" button
7. Success message appears
8. Product list refreshes
9. Form returns to "Create" mode

### Canceling Edit
1. While in edit mode, click "Cancel Edit" button
2. Form clears and returns to "Create" mode

---

## Form Behavior

### Create Mode
- Title: "Add New Product"
- Submit Button: "Create Product"
- No Cancel button visible
- Product Code field enabled (required for new products)

### Edit Mode
- Title: "Edit Product"
- Submit Button: "Update Product"
- Cancel button visible
- Product Code field disabled (cannot change code)
- All fields populate with existing data

---

## API Endpoints Used

### For Update
```
PUT /api/products/{productId}
Headers:
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data
```

### For Loading Product
```
GET /api/products/{productId}
Headers:
  - Authorization: Bearer {token}
```

---

## Key Features

✅ **Validation**
- Required fields: Name, Price, Category
- Price must be positive number
- Error messages displayed in UI

✅ **Image Handling**
- Supports adding new images during update
- Preserves existing images if none provided
- Only uploads new File objects

✅ **Size/Quantity Management**
- Maintains existing size/quantity pairs
- Can add/remove sizes during edit
- Filters out empty entries before saving

✅ **User Feedback**
- Loading states show operation progress
- Success messages confirm updates
- Error messages display failures
- Auto-scroll to form on edit load

✅ **Admin Only**
- Only accessible to authenticated admins
- Token-based authorization
- Redirects non-admins to home page

---

## Form Fields

All fields available in update mode:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Product Code | Text | No | Disabled in edit mode |
| Product Name | Text | Yes | Max length varies |
| Price | Number | Yes | Must be > 0 |
| Description | Text | No | Optional |
| Category | Text | Yes | Required field |
| Sub Category | Text | No | Optional |
| Brand | Text | No | Optional |
| Rating | Select | No | 1-5 scale |
| Best Seller | Checkbox | No | Boolean flag |
| Discount | Number | No | Percentage |
| Images | File | No | Multiple files allowed |
| Size & Quantity | Dynamic | No | Add/remove sizes |

---

## Error Handling

### Update Failure Scenarios
- Missing required fields → Validation error
- Invalid token → 401 error with message
- Product not found → 404 error with message
- Server error → 500 error with message
- Network error → Connection error message

### All errors displayed in red error box with specific message

---

## Testing Checklist

- [ ] Create new product successfully
- [ ] Load product for edit and verify all fields populated
- [ ] Update product name only
- [ ] Update price only
- [ ] Update with new images
- [ ] Update without adding new images (preserve existing)
- [ ] Add/remove sizes in edit mode
- [ ] Cancel edit and return to create mode
- [ ] Verify success message displays
- [ ] Verify refresh shows updated product
- [ ] Test validation (empty required fields)
- [ ] Test invalid price (negative/zero)

---

## Debug Information

All operations logged in debug console under:
- `Product` namespace
- Different debug levels:
  - `debugInfo`: General information
  - `debugSuccess`: Successful operations
  - `debugError`: Failed operations
  - `debugAPI`: API request details
  - `debugAPIResponse`: API response details

---

## Files Modified

1. **src/components/product/Product.jsx**
   - Added `editingProductId` state
   - Added `updateProduct()` function
   - Added `loadProductForEdit()` function
   - Added `clearForm()` function
   - Modified form heading to show mode
   - Modified submit button to show mode
   - Added Edit button to product table
   - Added Cancel Edit button in edit mode

## Backend Requirements

Your backend API must support:

```
PUT /api/products/{productId}
- Accept FormData with multipart/form-data
- Support partial updates (not all fields required)
- Preserve existing data if field not included
- Handle image array updates
```

Optional: Consider adding PATCH endpoint for better partial update semantics.

---

## Future Enhancements

- Bulk edit for multiple products
- Draft save functionality
- Update history/changelog
- Product comparison before/after
- Batch update operations
- Image preview in edit mode
- Auto-save to prevent data loss

