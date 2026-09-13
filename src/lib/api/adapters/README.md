One adapter interface + mock implementation per module (e.g. LeadsAdapter).
Components call hooks in src/hooks, hooks call adapters here — never fetch()
directly from a component. Swapping to a live backend later means adding a
`*.rest-adapter.ts` next to the mock one and changing a single import.
