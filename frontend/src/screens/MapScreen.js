import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  LoadScript,
  GoogleMap,
  StandaloneSearchBox,
  Marker,
} from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { Store } from "../Store";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";

// Default location for the map
const defaultLocation = { lat: 45.516, lng: -73.56 };
// Required Google Maps libraries
const libs = ["places"];

export default function MapScreen() {
  // Get userInfo from the global state
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;
  const navigate = useNavigate();

  // State variables for Google API key, map center, and selected location
  // eslint-disable-next-line
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [center, setCenter] = useState(defaultLocation);
  const [location, setLocation] = useState(center);

  // Refs for map, search box, and marker
  const mapRef = useRef(null);
  const placeRef = useRef(null);
  const markerRef = useRef(null);

  // Function to get the user's current location using Geolocation API
  const getUserCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation os not supported by this browser");
    } else {
      navigator.geolocation.getCurrentPosition((position) => {
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    }
  };

  // Fetch Google API key and user's current location on component mount
  useEffect(() => {
    const fetch = async () => {
      const { data } = await axios("/api/keys/google", {
        headers: { Authorization: `BEARER ${userInfo.token}` },
      });
      setGoogleApiKey(data.key);
      getUserCurrentLocation();
    };

    fetch();
    ctxDispatch({
      type: "SET_FULLBOX_ON",
    });
  }, [ctxDispatch, userInfo]);

  // Function called when the map loads
  const onLoad = (map) => {
    mapRef.current = map;
  };

  // Function called when the map becomes idle (user stops interacting)
  const onIdle = () => {
    setLocation({
      lat: mapRef.current.center.lat(),
      lng: mapRef.current.center.lng(),
    });
  };

  // Function called when the search box loads
  const onLoadPlaces = (place) => {
    placeRef.current = place;
  };

  // Function called when places in the search box change
  const onPlacesChanged = () => {
    const place = placeRef.current.getPlaces()[0].geometry.location;
    setCenter({ lat: place.lat(), lng: place.lng() });
    setLocation({ lat: place.lat(), lng: place.lng() });
  };

  // Function called when the marker loads
  const onMarkerLoad = (marker) => {
    markerRef.current = marker;
  };

  // Function to confirm the selected location and navigate to the shipping screen
  const onConfirm = () => {
    const places = placeRef.current.getPlaces() || [{}];
    ctxDispatch({
      type: "SAVE_SHIPPING_ADDRESS_MAP_LOCATION",
      payload: {
        lat: location.lat,
        lng: location.lng,
        address: places[0].formatted_address,
        name: places[0].name,
        vicinity: places[0].vicinity,
        googleAddressId: places[0].id,
      },
    });
    toast.success("Location selected successfully!!");
    navigate("/shipping");
  };

  return (
    <div className="full-box">
      {/* Load the Google Maps script and display the map */}
      <LoadScript
        libraries={libs}
        googleMapsApiKey={"AIzaSyCBNf4h-u1OELC6QHfEJQfVesaEd1P6kHM"}
      >
        <GoogleMap
          id="sample-map"
          mapContainerStyle={{ height: "100%", width: "100%" }}
          center={center}
          zoom={15}
          onLoad={onLoad}
          onIdle={onIdle}
        >
          {/* StandaloneSearchBox for location search */}
          <StandaloneSearchBox
            onLoad={onLoadPlaces}
            onPlacesChanged={onPlacesChanged}
          >
            <div className="map-input-box">
              <input type="text" placeholder="Enter your address"></input>
              <Button type="button" onClick={onConfirm}>
                Confirm
              </Button>
            </div>
          </StandaloneSearchBox>
          {/* Marker to indicate the selected location */}
          <Marker position={location} onLoad={onMarkerLoad}></Marker>
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
