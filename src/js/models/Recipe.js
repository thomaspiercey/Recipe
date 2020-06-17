import axios from "axios";
import { key, proxy } from "../config";

export default class Recipe {
  constructor(id) {
    this.id = id;
  }
  async getRecipe() {
    try {
      const result = await axios(
        `${proxy}https://forkify-api.herokuapp.com/api/get?key=${key}&rId=${this.id}`
      );
      this.title = result.data.recipe.title;
      this.author = result.data.recipe.publisher;
      this.img = result.data.recipe.image_url;
      this.url = result.data.recipe.source_url;
      this.ingredients = result.data.recipe.ingredients;
    } catch (error) {
      console.log(error);
      alert("Something went wrong :(");
    }
  }

  calcTime() {
    // Assuming we need 15 minutes for each 3 ingredients
    const numIngredients = this.ingredients.length;
    const timePeriod = Math.ceil(numIngredients / 3);
    this.time = timePeriod * 15;
  }

  calcServings() {
    this.servings = 4;
  }

  // Cleans the data into a unifrom metrics
  parseIngredients() {
    const unitsLong = [
      "tablespoons",
      "tablespoon",
      "ounces",
      "ounce",
      "teaspoons",
      "teaspoon",
      "cups",
      "pounds",
    ];
    const unitsShort = [
      "tbsp",
      "tbsp",
      "oz",
      "oz",
      "tsp",
      "tsp",
      "cup",
      "pound",
    ];
    const units = [...unitsShort, "kg", "g"];

    const newIngredient = this.ingredients.map((el) => {
      // 1. Uniform metrics
      let ingredient = el.toLowerCase();
      unitsLong.forEach((metric, i) => {
        ingredient = ingredient.replace(metric, units[i]);
      });

      // 2. Remove parenthesis
      ingredient = ingredient.replace(/ *\([^]*\) */g, " ");

      // 3. Parse ingredients into count, unit and ingredient
      const arrIngredient = ingredient.split(" ");
      const unitIndex = arrIngredient.findIndex((el2) =>
        unitsShort.includes(el2)
      );

      let objIngredient;
      if (unitIndex > -1) {
        // There is a unit
        // Example: 4 1/2 cups, arrCount is [4,1/2] --> eval("4+1/2") --> 4.5
        // Example: 4 cups, arrCount is [4]
        const arrCount = arrIngredient.slice(0, unitIndex);
        let count;
        if (arrCount.length === 1) {
          count = eval(arrIngredient[0].replace("-", "+")); // replace "-" with "+"
        } else {
          count = eval(arrIngredient.slice(0, unitIndex).join("+"));
        }

        objIngredient = {
          count,
          unit: arrIngredient[unitIndex],
          ingredient: arrIngredient.slice(unitIndex + 1).join(" "),
        };
      } else if (parseInt(arrIngredient[0], 10)) {
        // There is NO unit, but 1st element is a number
        objIngredient = {
          count: parseInt(arrIngredient[0], 10),
          unit: "",
          ingredient: arrIngredient.slice(1).join(" "),
        };
      } else if (unitIndex === -1) {
        // There is NO unit and NO number in 1st position
        objIngredient = {
          count: 1,
          unit: "",
          ingredient,
        };
      }

      return objIngredient;
    });
    this.ingredients = newIngredient;
  }

  updateServings(type) {
    // Servings
    const newServings =
      type === "decrease" ? this.servings - 1 : this.servings + 1;
    // Ingredients
    this.ingredients.forEach((ingredient) => {
      ingredient.count *= newServings / this.servings;
    });

    this.servings = newServings;
  }
}
