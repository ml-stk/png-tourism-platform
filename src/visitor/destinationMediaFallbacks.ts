export interface DestinationFallbackMedia {
  url: string;
  altText: string;
  credit: string;
}

const commons = (file: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file).replace(/%2F/g, '/')}`;

export const destinationMediaFallbacks: Record<string, DestinationFallbackMedia> = {
  'alotau': { url: commons('MilneBay-Alotau.JPG'), altText: 'Milne Bay waterfront at Alotau, Papua New Guinea', credit: 'Wikimedia Commons — Manuel Hetzel, CC BY-SA 3.0' },
  'bomana-war-cemetery': { url: commons('View of Nine-Mile Quarry from Bomana War Cemetery near Port Moresby.jpg'), altText: 'View from Bomana War Cemetery near Port Moresby', credit: 'Wikimedia Commons — arthur_chapman, CC BY 2.0' },
  'bougainville-island': { url: commons('Bagana Volcano.jpg'), altText: 'Bagana Volcano on Bougainville Island, Papua New Guinea', credit: 'Wikimedia Commons — U.S. Geological Survey, public domain' },
  'ela-beach': { url: 'assets/destinations/ela-beach_img1.png', altText: 'Ela Beach waterfront and APEC Haus at night, Port Moresby', credit: 'PNGTPA project asset' },
  'fly-river': { url: commons('Beautiful true-color image of the Fly River in Papua New Guinea from S-NPP (25176332426).jpg'), altText: 'Fly River in Papua New Guinea', credit: 'Wikimedia Commons — NASA/NOAA imagery' },
  'goroka': { url: commons('Goroka.JPG'), altText: 'Goroka, Eastern Highlands Province, Papua New Guinea', credit: 'Wikimedia Commons — Manuel Hetzel, CC BY 3.0' },
  'isurava-memorial': { url: commons('Kokoda track Papua New Guinea.JPG'), altText: 'Kokoda Track between Kokoda and Isurava, Papua New Guinea', credit: 'Wikimedia Commons — Luke Brindley, CC BY-SA 4.0' },
  'kavieng': { url: commons('Kavieng underwater 596.jpg'), altText: 'Underwater scene at Kavieng, New Ireland Province', credit: 'Wikimedia Commons — licensed media' },
  'kimbe-bay': { url: commons('Kimbe Bay islands.jpg'), altText: 'Kimbe Bay islands, West New Britain Province', credit: 'Wikimedia Commons — licensed media' },
  'kiriwina': { url: commons('A Kiriwina Village, Memoirs Bishop Museum, Vol. II, Fig. 55.jpg'), altText: 'Kiriwina village in the Trobriand Islands, Papua New Guinea', credit: 'Wikimedia Commons — Bernice Pauahi Bishop Museum, public domain' },
  'loloata-island': { url: commons('(Aerial view of Port Moresby coastline in Papua New Guinea) - DPLA - e1029ad7f197bd6a97d7e8c84e6cfa95.jpg'), altText: 'Aerial coastal view near Port Moresby, Papua New Guinea', credit: 'Wikimedia Commons — DPLA contribution' },
  'madang': { url: commons('Madang (5501569807).jpg'), altText: 'Madang, Papua New Guinea', credit: 'Wikimedia Commons — eGuide Travel' },
  'misima-island': { url: commons('Misima Island.jpg'), altText: 'Misima Island in Milne Bay Province, Papua New Guinea', credit: 'Wikimedia Commons — Givet, CC BY-SA 4.0' },
  'mount-hagen': { url: commons('Papua New Guinea Mt Hagen (5987279998) (2).jpg'), altText: 'Mount Hagen, Papua New Guinea', credit: 'Wikimedia Commons — eGuide Travel' },
  'mount-hagen-cultural-show': { url: commons('Mount Hagen Cultural Show, Papua New Guinea, 2009.jpg'), altText: 'Mount Hagen Cultural Show, Papua New Guinea', credit: 'Wikimedia Commons — Yves Picq' },
  'mount-wilhelm': { url: commons('Mount Wilhelm.jpg'), altText: 'Mount Wilhelm, Papua New Guinea', credit: 'Wikimedia Commons — Nomadtales' },
  'national-museum-and-art-gallery': { url: commons('Papua New Guinea National Museum May 2015.jpg'), altText: 'Papua New Guinea National Museum and Art Gallery, Port Moresby', credit: 'Wikimedia Commons — Nick-D' },
  'owers-corner': { url: commons('Owers Corner.jpg'), altText: 'Owers Corner, Papua New Guinea', credit: 'Wikimedia Commons' },
  'port-moresby-nature-park': { url: commons('US Army Soldiers experience PNG culture during Tamiok Strike 24 (8551667).jpg'), altText: 'Raggiana bird-of-paradise at Port Moresby Nature Park', credit: 'Wikimedia Commons — U.S. Army' },
  'tari': { url: commons('Tari Gap - 8606553450.jpg'), altText: 'Tari Gap, Hela Province, Papua New Guinea', credit: 'Wikimedia Commons — Ron Knight, CC BY 2.0' },
  'tavurvur-volcano': { url: commons('Tavurvur volcano 3.jpg'), altText: 'Tavurvur Volcano in the Rabaul caldera, Papua New Guinea', credit: 'Wikimedia Commons — Taro Taylor, CC BY 2.0' },
  'tawali': { url: commons('MilneBay-Alotau.JPG'), altText: 'Milne Bay coastal landscape near Alotau, Papua New Guinea', credit: 'Wikimedia Commons — Manuel Hetzel, CC BY-SA 3.0' },
  'tufi-fjords': { url: commons('Tufi Town.jpg'), altText: 'Tufi village and fjord, Oro Province, Papua New Guinea', credit: 'Wikimedia Commons — Larry V. Dumlao, CC BY-SA 4.0' },
  'vanimo': { url: commons('Vanimo from the air.jpg'), altText: 'Vanimo town from the air, Papua New Guinea', credit: 'Wikimedia Commons — Nomadtales, CC BY-SA 3.0' },
  'wewak': { url: commons('WewakBeach.jpg'), altText: 'Wewak Beach, Papua New Guinea', credit: 'Wikimedia Commons — Toksave, CC BY-SA 3.0' },
  'kokoda-track': { url: commons('Kokoda track Papua New Guinea.JPG'), altText: 'Kokoda Track, Papua New Guinea', credit: 'Wikimedia Commons — Luke Brindley, CC BY-SA 4.0' },
  'milne-bay': { url: commons('MilneBay-Alotau.JPG'), altText: 'Milne Bay at Alotau, Papua New Guinea', credit: 'Wikimedia Commons — Manuel Hetzel, CC BY-SA 3.0' },
  'rabaul': { url: commons('Rabaul.jpg'), altText: 'Rabaul and Tavurvur Volcano, Papua New Guinea', credit: 'Wikimedia Commons — Ian the Paperboy, CC BY 2.0' },
  'sepik-river': { url: commons('Sepik River IMG 2119.jpg'), altText: 'Sepik River, Papua New Guinea', credit: 'Wikimedia Commons — David Bacon, CC BY 2.0' },
  'western-highlands': { url: commons('Mount Hagen Sing Sing 2019 (49059928568).jpg'), altText: 'Mount Hagen Sing Sing, Western Highlands, Papua New Guinea', credit: 'Wikimedia Commons — gailhampshire' },
};
