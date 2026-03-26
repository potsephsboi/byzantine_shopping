// js/images_data.js
// Central registry of image properties.
// Edit/add entries to match your actual images in /assets or wherever you keep them.
// Fields:
//  - id: unique identifier string you will use across pages
//  - src: canonical filename or relative path (we match by filename if needed)
//  - ratio: width:height string (e.g. "1:1", "2:1", "3:2")
//  - basePrice: numeric base price in your currency

window.IMAGES_DATA = [
  {
    id: "toix-001",
    src: "fjord.jpg",
    ratio: "2:1",
    basePrice: 5
  },
  {
    id: "toix-002",
    src: "nordic.png",
    ratio: "3:2",
    basePrice: 9
  }

];
