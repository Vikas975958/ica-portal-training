import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlices";
import themeSlice from "./slices/themeSlices";

export { emptyStore } from "./actions";

const rootReducer = combineReducers({
  authSlice,
  themeSlice,
});

export default rootReducer;
