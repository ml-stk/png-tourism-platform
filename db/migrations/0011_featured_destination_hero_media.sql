insert into media_assets (id, kind, storage_key, public_url, alt_text, caption, mime_type, province_code, publication_status, version, updated_at)
values
  (gen_random_uuid(), 'image', 'destinations/kokoda-track/hero.jpg', 'https://commons.wikimedia.org/wiki/Special:FilePath/OwenStanleyRangeOwersCornerView.jpg', 'Kokoda Track, Oro Province', 'Kokoda Track — Oro Province', 'image/jpeg', 'ORO', 'published', 1, now()),
  (gen_random_uuid(), 'image', 'destinations/milne-bay/hero.jpg', 'https://www.divediscovery.com/images/kenu_kundu_festival_4.jpg', 'Milne Bay, Papua New Guinea', 'Milne Bay — Milne Bay Province', 'image/jpeg', 'MILNE_BAY', 'published', 1, now()),
  (gen_random_uuid(), 'image', 'destinations/rabaul/hero.jpg', 'https://img.rezdy.com/PRODUCT_IMAGE/13699/national-mask-festival-rabaul-papua-new-guinea.jpg', 'Rabaul, East New Britain Province', 'Rabaul — East New Britain Province', 'image/jpeg', 'EAST_NEW_BRITAIN', 'published', 1, now()),
  (gen_random_uuid(), 'image', 'destinations/sepik-river/hero.jpg', 'https://www.lernidee.de/images/travel-image/180-2_sonnenuntergang_auf_dem_sepik_fluss_-_marziafra_fotolia_x.jpg', 'Sepik River, East Sepik Province', 'Sepik River — East Sepik Province', 'image/jpeg', 'EAST_SEPIK', 'published', 1, now()),
  (gen_random_uuid(), 'image', 'destinations/western-highlands/hero.jpg', 'https://peakvisor.com/photo/SD/Papua-New-Guinea-mount-hagen-august-1463442698.jpg', 'Western Highlands, Papua New Guinea', 'Western Highlands — Papua New Guinea', 'image/jpeg', 'WESTERN_HIGHLANDS', 'published', 1, now())
on conflict (storage_key) do update set
  public_url = excluded.public_url,
  alt_text = excluded.alt_text,
  caption = excluded.caption,
  mime_type = excluded.mime_type,
  province_code = excluded.province_code,
  publication_status = excluded.publication_status,
  version = media_assets.version + 1,
  updated_at = now();

insert into destination_media (destination_id, media_asset_id, sort_order)
select d.id, m.id, 0
from destinations d
join media_assets m on m.storage_key = 'destinations/' || d.slug || '/hero.jpg'
where d.slug in ('kokoda-track','milne-bay','rabaul','sepik-river','western-highlands')
on conflict (destination_id, media_asset_id) do update set sort_order = excluded.sort_order;
