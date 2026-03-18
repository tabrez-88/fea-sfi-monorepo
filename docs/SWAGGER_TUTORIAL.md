# How to Use the SFI-FEA API with Swagger UI

**Audience:** Non-technical users testing the API
**Last Updated:** February 2026

---

## What is Swagger UI?

Swagger UI is a **visual testing tool** that lets you interact with the API directly from your web browser. Think of it as a remote control for the system — you fill in forms, press "Execute", and see the results instantly. No coding or technical setup required.

---

## Opening Swagger UI

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: **http://localhost:3001/docs**
3. You should see a page listing all available API endpoints, grouped by category

> *[Screenshot: Swagger UI landing page]*

---

## Understanding the Interface

### Endpoint Card

Each endpoint is displayed as a colored card:

| Color | HTTP Method | Meaning |
|-------|-------------|---------|
| **Green** | GET | Retrieve/view data |
| **Blue** | POST | Create new data |
| **Orange** | PATCH | Update existing data |
| **Red** | DELETE | Remove data |

> *[Screenshot: Endpoint cards showing color coding]*

### Anatomy of an Endpoint

Each card shows:
- **Method + Path** — e.g., `POST /api/v1/deals`
- **Summary** — a short description of what this endpoint does
- Click on any card to expand it and see the details

---

## How to Execute an API Call (Step by Step)

### Step 1: Click on the Endpoint

Find the endpoint you want to test and **click on it** to expand the panel.

> *[Screenshot: Clicking on POST /api/v1/deals to expand]*

### Step 2: Click "Try it out"

In the expanded panel, you'll see a **"Try it out"** button in the top-right corner. Click it.

This switches the panel from read-only mode to **edit mode**, allowing you to type in request data.

> *[Screenshot: "Try it out" button highlighted]*

### Step 3: Fill in the Request

You'll see two types of input fields:

**Path Parameters** (if any):
- These appear as text boxes above the request body
- Example: `dealId` — paste the deal's ID here
- These are part of the URL, replacing `{dealId}` in the path

**Request Body** (if any):
- This is a large text box with a JSON template
- Replace the template with the actual data you want to send
- Make sure to keep the JSON format valid (curly braces, quotes, commas)

> *[Screenshot: Path parameter field and request body editor]*

### Step 4: Click "Execute"

Press the blue **"Execute"** button at the bottom of the panel.

> *[Screenshot: Execute button highlighted]*

### Step 5: Read the Response

After executing, scroll down to see the **Server Response** section:

| Section | What It Shows |
|---------|---------------|
| **Response Code** | A number like `201` (success) or `400` (error) |
| **Response Body** | The JSON data returned by the server |
| **Response Headers** | Technical headers (you can ignore these) |

> *[Screenshot: Response section showing code and body]*

### Common Response Codes

| Code | Meaning | What to Do |
|------|---------|------------|
| **200** | OK — request successful | Everything worked |
| **201** | Created — new record created | Copy the `"id"` from the response |
| **400** | Bad Request — invalid data | Check your JSON format and required fields |
| **404** | Not Found — ID doesn't exist | Double-check the ID you entered |
| **409** | Conflict — invalid state transition | The record is in the wrong status for this action |
| **500** | Server Error | Something went wrong on the server side |

---

## Practical Tips

### Copying IDs

After creating any record (deal, participant, revenue batch, etc.), the response will include an `"id"` field. **You will need this ID for the next steps.**

How to copy:
1. Find the `"id"` field in the response body
2. Select the value (the text between the quotes)
3. Copy it (Ctrl+C or Cmd+C)
4. Paste it into the next endpoint's path parameter or request body

> *[Screenshot: Highlighting an ID in the response to copy]*

### Handling Errors

If you see an error response (code 400 or higher), the response body will contain a `"message"` field explaining what went wrong:

```json
{
  "statusCode": 400,
  "message": "Revenue batch abc-123 must be in VALIDATED status (current: PENDING)",
  "error": "Bad Request"
}
```

Read the `"message"` carefully — it usually tells you exactly what to fix.

### JSON Formatting

The request body must be valid JSON. Common mistakes:
- Missing comma between fields
- Extra comma after the last field
- Missing quotes around text values
- Using single quotes instead of double quotes

**Correct:**
```json
{
  "name": "Example Deal",
  "effectiveDate": "2026-01-01"
}
```

**Incorrect:**
```json
{
  "name": "Example Deal",
  "effectiveDate": "2026-01-01",
}
```
(Notice the trailing comma after the last field — this will cause an error)

---

## Quick Reference: The Settlement Flow

The complete settlement process follows these 9 steps in order. Each step depends on the previous one.

```
Step 1: Create Deal
    ↓ (save deal ID)
Step 2: Add Participants (repeat 5x)
    ↓ (save all participant IDs)
Step 3: Create Rule Snapshot
    ↓ (save rule snapshot ID)
Step 4: Register Revenue
    ↓ (save revenue batch ID)
Step 5: Validate Revenue
    ↓
Step 6: Create Settlement Run
    ↓ (save settlement run ID)
Step 7: Preview Settlement
    ↓ (review the numbers)
Step 8: Finalize Settlement
    ↓
Step 9: View Settlement Details
```

Each step is documented in detail in the **Live Implementation Guide** (`SETTLEMENT_LIVE_DEMO.md`).

---

*For detailed step-by-step instructions with request/response examples, see the **Live Implementation Guide**.*
