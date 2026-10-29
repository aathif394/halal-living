"use client";

import Logic from "./restaurant-logic";
import { makeHost } from "./runtime";
import View from "./restaurant-view";

export const RestaurantDetail = makeHost("Restaurant Detail", Logic, View);
