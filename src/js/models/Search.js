import axios from "axios"; // Using axios instead of fetch
import { key, proxy } from "../config";

export default class Search {
  constructor(query) {
    this.query = query;
  }

  async getResults() {
    try {
      const query = await axios(
        `${proxy}https://forkify-api.herokuapp.com/api/search?key=${key}&q=${this.query}`
      );
      this.result = query.data.recipes;
      //   console.log(this.result);
    } catch (error) {
      alert(error);
    }
  }
}
