//encapsulate localStorage
export default {
  getLocal(key) {
    return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : "";
  },
  //setting
  setLocal(key, value) {
    if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
  },
  //delete
  remove(key) {
    key ? localStorage.removeItem(key) : localStorage.removeItem();
  },
};
