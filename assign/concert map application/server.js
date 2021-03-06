const express = require("express");
const axios = require("axios");
var app = express();
var morgan = require('morgan')
const path = require('path');

//set all api keys
const SONGKICK_APIKEY = `8404I3RKFBVZxwC1`;
const FLICKR_APIKEY = `48e902ee2414ce46b20a7d557b1000fc`;
const FLICKR_SECRET = `11811ac81108a384`;
app.use(morgan('tiny'))

//get location using lng and lat
function getLocationsByInt(lat, lng, per_page) {
  const url = `https://api.songkick.com/api/3.0/search/locations.json?location=geo:${lat},${lng}&apikey=${SONGKICK_APIKEY}&per_page=${per_page}`;
  return axios.get(url).then((params) => {
    return params.data;
  });
}

//get location marker using location id
const getMarketBySk = (sk) => {
  const url = `https://api.songkick.com/api/3.0/events.json?apikey=${SONGKICK_APIKEY}&location=sk:${sk}`;
  return axios.get(url).then((params) => {
    return params.data;
  });
};

//get location marker using artist name
const getNameMarketByGeo = (name) => {
  const url = `https://api.songkick.com/api/3.0/events.json?apikey=${SONGKICK_APIKEY}&artist_name=${name}`;
  return axios.get(url).then((params) => {
    return params.data;
  });
};

//get image
const getImg = (name) => {
  const url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${FLICKR_APIKEY}&sort=relevance&page=1&per_page=1&extras=owner_name,tags,views,description,url_q,url_l&text=${name}&tags=&format=json&nojsoncallback=1&safe_search=3&safe=3`;
  return axios.get(url).then((params) => {
    return params.data;
  });
};

//get lng and lat from client
app.get("/api/getLocations", function (req, res) {
  var { lat, lng, per_page = 10 } = req.query;
  getLocationsByInt(lat, lng, per_page).then((rs) => {
    var data = rs.resultsPage.results.location;
    res.json({ data });
  });
});

//get location id from client
app.get("/api/getMarker", function (req, res) {
  var { sk, name } = req.query;
  getMarketBySk(sk).then(async (rs) => {
    var data = rs.resultsPage.results.event
      ? rs.resultsPage.results.event[0]
      : {};
    var imgSrc = ''
    if (data.venue) {
      var imgRes = await getImg(data.venue.displayName);
      console.log(111,imgRes)
      // grab the first image from flickr to display the location of the venue
      //if no image return empty string
      imgSrc = imgRes.photos.photo.length ? imgRes.photos.photo[0].url_q : '';
    }
    res.json({ data: { ...data, imgSrc } });
  });
});

//get artist name from client
app.get("/api/searchName", function (req, res) {
  var { geo, name } = req.query;
  getNameMarketByGeo(name).then(async (rs) => {
    var data =
      rs.resultsPage.results.event && rs.resultsPage.results.event.length
        ? rs.resultsPage.results.event
        : [];
    data.forEach(async (element) => {
      try {
        var imgRes = await getImg(element.venue.displayName);
        element.imgSrc = imgRes.photos.photo.length ? imgRes.photos.photo[0].url_q : '';
      } catch (error) {
        element.imgSrc = ''
      }
    });
    setTimeout(() => {
      res.json({ data });
    }, 1500)
  });
});
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(3001, () => {
  console.log("1 ->  start  3001:");
});
