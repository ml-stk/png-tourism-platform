update media_assets
set public_url = 'https://papuanewguinea.travel/wp-content/uploads/2026/01/Life-along-the-Sepik-River-at-dusk-1-768x576.jpg',
    alt_text = 'Sepik River at dusk, East Sepik Province',
    caption = 'Sepik River — East Sepik Province',
    version = version + 1,
    updated_at = now()
where storage_key = 'destinations/sepik-river/hero.jpg';
