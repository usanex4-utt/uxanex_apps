import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { MomentsAPI } from "../../api/moments";

export const fetchStoryRow = createAsyncThunk("moments/storyRow", async () => {
  const d = await MomentsAPI.storyRow();
  return d.groups || [];
});

const slice = createSlice({
  name: "moments",
  initialState: { groups: [], status: "idle", lastFetchedAt: 0 },
  reducers: { invalidateMoments(s) { s.lastFetchedAt = 0; } },
  extraReducers: (b) => {
    b.addCase(fetchStoryRow.pending,   (s) => { s.status = "loading"; });
    b.addCase(fetchStoryRow.fulfilled, (s, a) => { s.groups = a.payload; s.status = "idle"; s.lastFetchedAt = Date.now(); });
    b.addCase(fetchStoryRow.rejected,  (s) => { s.status = "idle"; });
  },
});
export const { invalidateMoments } = slice.actions;
export default slice.reducer;