import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet-search";
import axios from "axios";

const PER_PAGE = 50;
var map = null;
var markersLayer = null;
export default function index() {
  const [artist_name, setartist_name] = useState("");
  const [geo, setGeo] = useState([-27.47, 153.02]); //set brisbane as default

  const initMap = (params) => {
    map = new L.Map("map", {
      zoom: 12,
      center: new L.latLng(geo),
    });

    var maks = new L.TileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    );
    map.addLayer(maks); //base layer

    markersLayer = new L.LayerGroup(); //layer contain searched elements

    map.addLayer(markersLayer);

    var searchCon = new L.Control.Search({
      url: "https://nominatim.openstreetmap.org/search?format=json&q={s}",
      jsonpParam: "json_callback",
      textPlaceholder:'Search by City',
      propertyName: "display_name",
      propertyLoc: ["lat", "lon"],
      marker: false,
    });

    searchCon.on("search:locationfound", (e) => {
      console.log("e -> :", e);
      setartist_name("");
      map.setZoom(9);
      var params = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        per_page: PER_PAGE,
      };
      axios.get("/api/getLocations", { params }).then((res) => {
        var data = res.data.data;
        data = _.uniqBy(data,'metroArea.id')
        data = data
          .map((it, index) => ({
            ...it,
            loc: [it.city.lat, it.city.lng],
          }))
          .map((it, index) => {
            var marker = new L.Marker(new L.latLng(it.loc)).on("click", (e) => {
              axios
                .get("/api/getMarker", {
                  params: {
                    sk: it.metroArea.id,
                    name: it.metroArea.displayName,
                  },
                })
                .then((res) => {
                  console.log("res -> :", res);
                  var data = res.data.data;

                  if (data.displayName) {
                    marker.bindPopup(`
                    <div className="pop">
                        <img
                            src=${data.imgSrc}
                            width="100"
                            height="100"
                            alt=""
                        />
                        <div>
                            <p>Event :${data.displayName}</p>
                            <p>Date of concert :${data.start.date}</p>
                            <p>City:${data.location.city}</p>
                            <p>Artist:${data.performance[0].displayName}</p>
                        </div>
                    </div>
                  `);
                  } else {
                    marker.bindPopup(`none`);
                  }
                });
            });
            markersLayer.addLayer(marker);
          });
      });
    });

    map.addControl(searchCon);
  };

  useEffect(() => {
    initMap();
  }, []);

  const search = (params) => {
    var params = {
      name: artist_name,
    };
    markersLayer.clearLayers();
    map.setZoom(2);
    axios.get("/api/searchName", { params }).then((res) => {
      var data = res.data.data;
      console.log("data -> :", data);
      if (!data.length) {
        alert("There is no artist of this name: ");
        return;
      }
      data = data
        .map((it, index) => ({
          ...it,
          loc: [it.location.lat, it.location.lng],
        }))
        .map((it, index) => {
          var marker = new L.Marker(new L.latLng(it.loc)).on("click", (e) => {
            if (it.displayName) {
              marker.bindPopup(`
              <div className="pop">
                  <img
                      src=${it.imgSrc}
                      width="100"
                      height="100"
                      alt=""
                  />
                  <div>
                      <p>Event:${it.displayName}</p>
                      <p>Date of concert:${it.start.date}</p>
                      <p>City:${it.location.city}</p>
                      <p>Artist:${it.performance[0].displayName}</p>
                  </div>
              </div>
            `);
            } else {
              marker.bindPopup(`none`);
            }
          });
          markersLayer.addLayer(marker);
        });
    });
  };

  return (
    <div>
      <h1> Events Map search React </h1>
      <p>
        <h2> Search by Artist: </h2>
        <input
          type="text"
          value={artist_name}
          onChange={(e) => setartist_name(e.target.value)}
        />
        <button onClick={search}>search</button>
      </p>
      <br />
      <div className="row">
        <div className="left">
          <div className="leaflet-wrap" id="map"></div>
        </div>
      </div>
    </div>
  );
}
