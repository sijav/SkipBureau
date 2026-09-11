# TileGrid

The tile grid, expressed as a column count rather than a tile width.

Home's twelve goals are drawn as four columns of 302 on a 24 gutter. The 302
is what 1280 minus three gutters divides into, so it is a result, not an
input: typing it in is what makes a grid that cannot reflow.

## Props

- `columns`: Columns at the widest size. Steps down to two, then one.
