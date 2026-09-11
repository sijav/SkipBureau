# I18nProvider

Activates a catalog and reports the one that is ACTUALLY ACTIVE.

`AppTheme` reads its direction off that value, so reporting a locale whose
catalog failed would put English text inside a right-to-left layout.

## Props

- `locale`: The locale the URL names. This provider does not choose one.
- `load`: How a catalog is fetched. Overridden so a story can render the failure.
