"use client";

import Logic from "./masjid-logic";
import { makeHost } from "./runtime";
import View from "./masjid-view";

export const MasjidDetail = makeHost("Masjid Detail", Logic, View);
