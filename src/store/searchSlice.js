import { createSlice } from "@reduxjs/toolkit";

const searchSlice = createSlice({
  name: "search",
initialState: {
    query: "",
    category: "",
    results: [],
    isOpen: false,
    recentSearches: [],
    filters: {
      categories: [],
      brands: [],
      priceRange: [0, 1000],
      minRating: 0,
      availability: [],
      saleOnly: false,
      condition: [],
      minDiscount: 0
    }
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
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.filters[filterType] = value;
    },
    resetFilters: (state) => {
      state.filters = {
        categories: [],
        brands: [],
        priceRange: [0, 1000],
        minRating: 0,
        availability: [],
        saleOnly: false,
        condition: [],
        minDiscount: 0
      };
    },
    toggleFilter: (state, action) => {
      const { filterType, value } = action.payload;
      if (Array.isArray(state.filters[filterType])) {
        const currentFilters = state.filters[filterType];
        if (currentFilters.includes(value)) {
          state.filters[filterType] = currentFilters.filter(item => item !== value);
        } else {
          state.filters[filterType] = [...currentFilters, value];
        }
      } else {
        state.filters[filterType] = !state.filters[filterType];
      }
    }
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
  setFilters,
  updateFilter,
  resetFilters,
  toggleFilter
} = searchSlice.actions;

export default searchSlice.reducer;