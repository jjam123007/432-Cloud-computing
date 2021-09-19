import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet-search";
import axios from "axios";


// request number of results from Songkick
const PER_PAGE = 50;
//instantiate map
var map = null;
var markersLayer = null;
export default function index() {
  // artist name
  const [artist_name, setartist_name] = useState("");
  //set brisbane as default
  const [geo, setGeo] = useState([-27.47, 153.02]); 

  // map function
  const initMap = (params) => {
    map = new L.Map("map", {
      zoom: 12,
      center: new L.latLng(geo),
    });

    //map icon
    var maks = new L.TileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    );
    //base layer
    map.addLayer(maks); 

    //layer contain searched elements
    markersLayer = new L.LayerGroup(); 
    map.addLayer(markersLayer);

    //search configuration  
    var searchCon = new L.Control.Search({
      url: "https://nominatim.openstreetmap.org/search?format=json&q={s}",
      jsonpParam: "json_callback",
      textPlaceholder: 'Search by City',
      propertyName: "display_name",
      propertyLoc: ["lat", "lon"],
      marker: false,
    });

    //search by location
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
        //get unique id to prevent duplicate markers
        data = _.uniqBy(data, 'metroArea.id')
        data = data
          .map((it, index) => ({
            ...it,
            loc: [it.city.lat, it.city.lng],
          }))
          .map((it, index) => {
            var marker = new L.Marker(new L.latLng(it.loc)).on("click", (e) => {
              //set the marker on clicked location search
              //get the data
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
                  //display the popup information
                  if (data.displayName) {
                    marker.bindPopup(`
                    <div className="pop">
                    ${data.imgSrc ? `<img
                    src=${data.imgSrc}
                    width="100"
                    height="100"
                    alt=""
                />`: 'No image previewed for the location'
                    }
                        <div>
                            <p>Event :${data.displayName}</p>
                            <p>Date of concert :${data.start.date}</p>
                            <p>City:${data.location.city}</p>
                            <p>Artist:${data.performance[0].displayName}</p>
                        </div>
                    </div>
                  `);
                  } else {
                    //if theres no event, set as none
                    marker.bindPopup(`No event in this location`);
                  }
                });
            });
            //add to layer
            markersLayer.addLayer(marker);
          });
      });
    });
    //add search control
    map.addControl(searchCon);
  };
  //enters the map using useEffect
  useEffect(() => {
    initMap();
  }, []);

  //search by artist name
  const search = (params) => {
    var params = {
      name: artist_name,
    };
    //clear layer
    markersLayer.clearLayers();
    map.setZoom(2);
    axios.get("/api/searchName", { params }).then((res) => {
      var data = res.data.data;
      console.log("data -> :", data);
      if (!data.length) {
        //invalid artist search, display error message
        alert("There is no artist of this name");
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
              ${it.imgSrc ? `<img
                src=${it.imgSrc}
                width="100"
                height="100"
                alt=""
            />`: 'No image previewed for the location'
                }
                  
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

  //display home page
  return (
    <div>
      <h1> Events Map search</h1>
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
