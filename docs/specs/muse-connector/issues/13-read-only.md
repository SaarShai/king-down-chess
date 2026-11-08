# Decide the read-only permission option

Type: grilling
Status: open
Blocked by: 12
Parent: [Muse connector map](../map.md)
Labels: wayfinder:grilling

## Question

The Muse guidelines ask for an option that limits Muse to reads "where possible". Supabase OAuth has no custom scopes. Which option does King Down offer?

## Options

1. **Muse's own controls** (recommended until review asks for more): Muse lets each user deny or ask for each tool, and the Help Center says many connectors can be limited to reads. The submission says so. No code.
2. **A second OAuth client** "Muse (read only)" whose tokens the server limits to the three read tools. Needs a second connector or a portal choice that may not exist.
3. **A consent checkbox** stored per user and checked by each write. Adds a table and a migration.
