# Hainhofer Viewer

The document viewer of the <a href="https://hainhofer.hab.de">Philipp Hainhofer online edition</a>, partly based on <a href="https://github.com/tify-iiif-viewer">TIFY</a>, provided as a Vue 2 component.

> This repository is not actively supported.


## Requirements

<a href="https://github.com/openseadragon/openseadragon/releases/tag/v2.4.0">The source files of OpenSeadragon v2.4.0</a> must be available in the `openseadragon` directory. The OpenSeadragon npm package does not include the required files.


## Usage

Import `Viewer.vue`, which in turn imports all other components as well as OpenSeadragon.


## Props

Only the `manifestUrl` is required.

- `cache` (object): A simple key-value store for caching data from the API.
- `handleHtml` (function): A function that is applied to the HTML of every page's fulltext. The only parameter is the HTML string.
- `loading` (number): This variable gets incremented on every load event and decremented (or set to `0`) when loading finishes. Must be used with the `sync` modifier.
- `manifestUrl` (string): The URL of the manifest to load.


## Events

- `addToCache`: Emits a `key` (string) and a `value` (any) to be handled by the app's caching function.
- `setTitle`: Emits a string once the manifest is loaded, containing the document title.
- `updateCustomCss`: Emits the manifest's custom CSS string (or `null`) on load.


## Manifests

The manifest must be a JSON file with the following structure. `post_id` is only used internally for the search API. The `pages` array can contain any number of page objects.

Example:

```json
{
   "post_id": 1,
   "title": "The title of this document",
   "description": "<p>A HTML string describing the document, displayed in the info panel.<\/p>\n",
   "css": ".html p { margin-bottom: 0; } /* This CSS is emitted via the `updateCustomCss` event */",
   "pages": [
      {
         "label": "The page's label as a string",
         "addition": "Additional information about this page, shown behind the label",
         "html": "<p>This page's fulltext as HTML string</p>",
         "notes": "<p>A HTML string of notes, displayed below the page text<\/p>",
         "image_url": "https:\/\/example.org\/fullsize\/image.jpg",
         "thumbnail_url": "https:\/\/example.org\/thumbnail\/image.jpg"
      }
      ⋮
   ]
}
```
