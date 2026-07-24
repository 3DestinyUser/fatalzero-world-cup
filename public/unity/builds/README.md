# Unity WebGL builds

Each specialized simulator is exported to a folder whose name matches a key in
`../catalog.json`.

Example:

```text
builds/
  lashing-hands-v1/
    index.html
    Build/
    TemplateData/
```

Keep the build disabled in the catalog until its event bridge and fallback path
have passed the complete FATALZERO mission test.
