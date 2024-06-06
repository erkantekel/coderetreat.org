import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.scss";
import { EventWithId, eventHasPhysicalLocation, eventToGeoJSONFeature} from "../events/EventType";
import { CommunityWithId, communityHasPhysicalLocation, communityToGeoJSONFeature } from "../events/CommunityType";

mapboxgl.accessToken =
  "pk.eyJ1IjoicnJhZGN6ZXdza2kiLCJhIjoiY2o3OWg4ZHV0MDFrdjM3b2FvcXFqdmtidiJ9.oULZ0ljtFZqMHFDbyvkwVQ";


export const Map = ({
  events,
  communities,
  onClickOnEvent,
}: {
  events: EventWithId[];
  communities: CommunityWithId[];
  onClickOnEvent?: (String) => void;
}) => {
  const mapRef = useRef(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    map.current = new mapboxgl.Map({
      dragRotate: false,
      container: mapRef.current!, // container element id
      style: "mapbox://styles/mapbox/light-v10",
      center: [Math.random() * 360 - 180, 30], // initial map center in [lon, lat]
      zoom: 1.15,
    });

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        showAccuracyCircle: false,
        trackUserLocation: false,
        fitBoundsOptions: {
          maxZoom: 7,
        },
      })
    );

    map.current.on("load", ({ target }) => {
      const communityDataSource: mapboxgl.GeoJSONSourceRaw = {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      };
      target.addSource("communities", communityDataSource);
      target.addLayer({
        id: "communities",
        type: "circle",
        source: "communities",
        paint: {
          "circle-color": "#EEA62B",
          "circle-radius": 5,
        },
      });
      target.addLayer({
        id: "communities-name",
        type: "symbol",
        source: "communities",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
        },
      });

      const eventDataSource: mapboxgl.GeoJSONSourceRaw = {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      };
      target.addSource("events", eventDataSource);
      target.addLayer({
        id: "events",
        type: "circle",
        source: "events",
        paint: {
          "circle-color": "#0FF",
          "circle-radius": 5,
        },
      });
      target.addLayer({
        id: "events-title",
        type: "symbol",
        source: "events",
        layout: {
          "text-field": ["get", "title"],
          "text-size": 12,
        },
      });

      target.on("click", ["events", "events-title"], (e) => {
        // Copy coordinates array.
        const feature = e.features?.[0];
        if (!feature) return;

        const div = document.createElement("div");
        div.innerHTML = `
        <h4>${feature.properties!.title}</h4>
        <p>${feature.properties!.city}, ${feature.properties!.country}</p>`;

        const link = document.createElement("a");
        link.addEventListener("click", (e) => {
          e.preventDefault();
          onClickOnEvent?.(feature.properties!.id);
          popup?.remove();
        });
        link.innerText = "View Event";
        link.href = "";
        div.appendChild(link);

        const popup = new mapboxgl.Popup()
          .setLngLat(
            (feature.geometry as GeoJSON.Point).coordinates as [number, number]
          )
          .setDOMContent(div)
          .addTo(target);
      });

      target.on("mouseenter", "events", () => {
        target.getCanvas().style.cursor = "pointer";
      });

      target.on("mouseleave", "events", () => {
        target.getCanvas().style.cursor = "";
      });

      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      setMapLoaded(false);
    };
  }, [mapRef]);

  console.log(events);
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const eventData: mapboxgl.GeoJSONSourceRaw["data"] = {
      type: "FeatureCollection",
      features: events
        .filter(eventHasPhysicalLocation)
        .map(eventToGeoJSONFeature),
    };
    (map.current.getSource("events") as mapboxgl.GeoJSONSource).setData(
      eventData
    );
  }, [events, map, mapLoaded]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const communityData: mapboxgl.GeoJSONSourceRaw["data"] = {
      type: "FeatureCollection",
      features: communities
        .filter(communityHasPhysicalLocation)
        .map(communityToGeoJSONFeature),
    };
    (map.current.getSource("communities") as mapboxgl.GeoJSONSource).setData(
      communityData
    );
  }, [communities, map, mapLoaded]);

  return (
    <div className="map-container border">
      <div ref={mapRef} className="map"></div>
    </div>
  );
};
