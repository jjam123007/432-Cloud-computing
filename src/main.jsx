import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import util from "./util";
//Mount to the global window 
//so you don’t have to import it every time
window.u = util;

ReactDOM.render(<App />, document.getElementById("root"));
