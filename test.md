
frontend sends:

API - /add category / update

```json
{
  "category_name": "",
  "brands": [] // list of BRAND object IDs
}
```

API - /add brand / update

```json
{
  "brand_name": "",
  "items": [] // list of ITEM object IDs
}
```

API - /add discount / update

```json
{
  "brand_id": "", // BRAND object ID
  "discount1": { "normal": 2, "special": 0 },
  "discount2": { "normal": 3, "special": 0 }
}
```

```json
API - /delete category
{ "category_id": ""} // CATEGORY object ID

API - /delete brand
{ "brand_id": ""} // BRAND object ID
```
