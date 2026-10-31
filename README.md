# Northstar planning site

A self-contained team purchase tracker built from the supplied planning brief.

Run it from this folder with any static server, for example:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`. Data is stored in the browser's local storage.

Run the small validation test with:

```sh
node --test planning-core.test.mjs
```
