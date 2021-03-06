/*///////////////////////////////
////// Global App Controller
*/
import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/********************************************
 * SEARCH CONTROLLER
 ********************************************/
const controlSearch = async () => {
  // 1. Get query from the view
  const query = searchView.getInput();

  if (query) {
    // 2. New search object and add to the state
    state.search = new Search(query);

    // 3. Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchResults);

    try {
      // 4. Search for recipes
      await state.search.getResults();

      // 5. Render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      alert("Something went wrong with the search...");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", (searchEvent) => {
  searchEvent.preventDefault(); // prevent page reload
  controlSearch();
});

elements.searchResultPages.addEventListener("click", (event) => {
  const btn = event.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/********************************************
 * RECIPE CONTROLLER
 ********************************************/
const controlRecipe = async () => {
  // Get ID from url
  const id = window.location.hash.replace("#", "");

  if (id) {
    // Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // Highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    // Create new recipe object
    state.recipe = new Recipe(id);

    try {
      // Get recipe data and parse ingredients
      await state.recipe.getRecipe();

      state.recipe.parseIngredients();

      // Calcuate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      // Render the recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
      alert("Error getting the recipe :(");
    }
  }
};

["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);

/********************************************
 * LIST CONTROLLER
 ********************************************/
const controlList = () => {
  // create an new list IF there is none yet
  if (!state.list) {
    state.list = new List();
  }

  //Add each ingredient to the list and UI
  state.recipe.ingredients.forEach((el) => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// Handle delete and update list item events
elements.shoppingList.addEventListener("click", (eventClick) => {
  const id = eventClick.target.closest(".shopping__item").dataset.itemid;
  //   Handle the delete button
  if (eventClick.target.matches(".shopping__delete, .shopping__delete *")) {
    // Delete from state
    state.list.deleteItem(id);
    // Delete from UI
    listView.deleteItem(id);
    // Handle the count update
  } else if (eventClick.target.matches(".shopping__count-value")) {
    const value = parseFloat(eventClick.target.value, 10);
    state.list.updateCount(id, value);
  }
});

/********************************************
 * LIKE CONTROLLER
 ********************************************/
const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  // User has NOT liked current recipe
  if (!state.likes.isLiked(currentID)) {
    // Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    // Toggle the liked button
    likesView.toggleLikeBtn(true);

    // Add like to UI list - breaks here
    likesView.renderLike(newLike);

    // User HAS liked current recipe
  } else {
    // Remove like to the state
    state.likes.deleteLike(currentID);

    // Toggle the liked button
    likesView.toggleLikeBtn(false);

    // Remove like from UI list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener("load", () => {
  state.likes = new Likes();

  //  Restore likes
  state.likes.readStorage();

  // Toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  // Render the existing likes
  state.likes.likes.forEach((like) => likesView.renderLike(like));
});

// Handing recipe button clicks
elements.recipe.addEventListener("click", (eventClick) => {
  if (eventClick.target.matches(".btn-decrease, .btn-decrease *")) {
    // Decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("decrease");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (eventClick.target.matches(".btn-increase, .btn-increase *")) {
    // Increase button is clicked
    state.recipe.updateServings("increase");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (
    eventClick.target.matches(".recipe__btn--add, .recipe__btn--add *")
  ) {
    //  Add ingredients to shopping list
    controlList();
  } else if (eventClick.target.matches(".recipe__love, .recipe__love *")) {
    // Like controller
    controlLike();
  }
});
