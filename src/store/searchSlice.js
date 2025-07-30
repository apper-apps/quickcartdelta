import { createSlice } from "@reduxjs/toolkit";

const searchSlice = createSlice({
  name: "search",
initialState: {
    query: "",
    category: "",
    results: [],
    isOpen: false,
    recentSearches: [],
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
},
    setCategory: (state, action) => {
      state.category = action.payload;
    },
    setResults: (state, action) => {
      state.results = action.payload;
    },
    openSearch: (state) => {
      state.isOpen = true;
    },
    closeSearch: (state) => {
      state.isOpen = false;
    },
    addRecentSearch: (state, action) => {
      const query = action.payload;
      if (query && !state.recentSearches.includes(query)) {
        state.recentSearches.unshift(query);
        if (state.recentSearches.length > 5) {
          state.recentSearches.pop();
        }
      }
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
  },
});

export const {
  setQuery,
  setCategory,
  setResults,
  openSearch,
  closeSearch,
  addRecentSearch,
  clearRecentSearches,
} = searchSlice.actions;

export default searchSlice.reducer;