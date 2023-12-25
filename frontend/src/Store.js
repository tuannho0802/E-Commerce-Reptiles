import React, { createContext, useReducer } from "react";

// Create a context for the global state
export const Store = createContext();

// Define the initial state for the global store
const initialState = {
  // Full box indicator for UI
  fullBox: false,
  // User information retrieved from local storage or set to null
  userInfo: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null,

  // Shopping cart information
  cart: {
    shippingAddress: localStorage.getItem("shippingAddress")
      ? JSON.parse(localStorage.getItem("shippingAddress"))
      : { location: {} }, // Default shipping address with an empty location
    paymentMethod: localStorage.getItem("paymentMethod")
      ? localStorage.getItem("paymentMethod")
      : "", // Default payment method
    cartItems: localStorage.getItem("cartItems")
      ? JSON.parse(localStorage.getItem("cartItems"))
      : [], // Default empty cart
  },
};

// Define the reducer function to handle state changes
function reducer(state, action) {
  switch (action.type) {
    // Set fullBox to true
    case "SET_FULLBOX_ON":
      return { ...state, fullBox: true };

    // Set fullBox to false
    case "SET_FULLBOX_OFF":
      return { ...state, fullBox: false };

    // Add an item to the shopping cart
    case "CART_ADD_ITEM":
      const newItem = action.payload;
      const existItem = state.cart.cartItems.find(
        (item) => item._id === newItem._id
      );
      // check exist item
      const cartItems = existItem
        ? state.cart.cartItems.map((item) =>
            item._id === existItem._id ? newItem : item
          )
        : [...state.cart.cartItems, newItem];
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      return { ...state, cart: { ...state.cart, cartItems } };

    // Remove an item from the shopping cart
    case "CART_REMOVE_ITEM": {
      const cartItems = state.cart.cartItems.filter(
        (item) => item._id !== action.payload._id
      );
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      return { ...state, cart: { ...state.cart, cartItems } };
    }

    // Clear all items from the shopping cart
    case "CART_CLEAR": {
      return { ...state, cart: { ...state.cart, cartItems: [] } };
    }

    // Sign in a user and update user information
    case "USER_SIGNIN":
      return { ...state, userInfo: action.payload };

    // Sign out a user and reset user information and cart
    case "USER_SIGNOUT":
      return {
        ...state,
        userInfo: null,
        cart: { cartItems: [], shippingAddress: {}, paymentMethod: "" },
      };

    // Save shipping address information
    case "SAVE_SHIPPING_ADDRESS":
      return {
        ...state,
        cart: { ...state.cart, shippingAdress: action.payload },
      };

    // Save shipping address map location information
    case "SAVE_SHIPPING_ADDRESS_MAP_LOCATION":
      return {
        ...state,
        cart: {
          ...state.cart,
          shippingAddress: {
            ...state.cart.shippingAddress,
            location: action.payload,
          },
        },
      };

    // Save payment method information
    case "SAVE_PAYMENT_METHOD":
      return {
        ...state,
        cart: { ...state.cart, paymentMethod: action.payload },
      };

    // Default case returns the current state
    default:
      return state;
  }
}

// Create a provider component to wrap the entire application with the store context
export function StoreProvider(props) {
  // Use the useReducer hook to manage state with the defined reducer and initial state
  const [state, dispatch] = useReducer(reducer, initialState);

  // Create a value object containing the state and dispatch function
  const value = { state, dispatch };

  // Provide the value object to the context through the Store.Provider
  return <Store.Provider value={value}>{props.children} </Store.Provider>;
}
